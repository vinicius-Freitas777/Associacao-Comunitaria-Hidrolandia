
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const appFile = path.resolve(__dirname, '..', 'script.js');

class FakeElement {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.handlers = {};
    this.dataset = {};
    this.attributes = {};
    this._classes = new Set();

    this.classList = {
      add: name => this._classes.add(name),
      remove: name => this._classes.delete(name),
      contains: name => this._classes.has(name),
      toggle: (name, force) => {
        const value = force === undefined
          ? !this._classes.has(name)
          : !!force;

        value
          ? this._classes.add(name)
          : this._classes.delete(name);

        return value;
      }
    };

    this.hidden = false;
    this.value = '';
    this.textContent = '';
    this.style = {};
  }

  set className(v) {
    this._classes = new Set(v.split(/\s+/).filter(Boolean));
  }

  get className() {
    return [...this._classes].join(' ');
  }

  append(...children) {
    this.children.push(...children);
  }

  replaceChildren(...children) {
    this.children = [...children];
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  removeAttribute(name) {
    delete this.attributes[name];
  }

  getAttribute(name) {
    return this.attributes[name] ?? null;
  }

  addEventListener(name, callback) {
    (this.handlers[name] ??= []).push(callback);
  }

  fire(name, event = {}) {
    for (const cb of this.handlers[name] ?? []) {
      cb(event);
    }
  }

  focus() {
    this.focused = true;
  }

  scrollIntoView() {}

  reset() {
    this.wasReset = true;
  }

  click() {
    this.clicked = true;
  }

  remove() {
    this.removed = true;
  }
}

function startApp({
  savedEvents = [],
  storedRaw,
  failSave = false,
  savedTheme = 'light'
} = {}) {

  const original = {};
  const globals = [
    'document',
    'window',
    'location',
    'localStorage',
    'URL',
    'Blob',
    'confirm'
  ];

  for (const name of globals) {
    original[name] = globalThis[name];
  }

  const ids = new Map();

  const byId = id => {
    if (!ids.has(id)) {
      ids.set(id, new FakeElement());
    }
    return ids.get(id);
  };

  const storage = new Map([
    [
      'portal_hidrolandia_atividades_v2',
      storedRaw === undefined
        ? JSON.stringify(savedEvents)
        : storedRaw
    ],
    ['portal_hidrolandia_tema_v1', savedTheme]
  ]);

  const pages = [
    'inicio',
    'noticias',
    'eventos',
    'servicos',
    'associados',
    'manifestacoes',
    'sobre',
    'configuracoes'
  ].map(name => {
    const el = new FakeElement();
    el.dataset.page = name;
    return el;
  });

  const routes = pages.map(el => {
    const route = new FakeElement();
    route.dataset.route = el.dataset.page;
    return route;
  });

  const goButtons = [new FakeElement()];
  goButtons[0].dataset.go = 'eventos';

  const document = {
    title: '',
    body: new FakeElement('body'),
    handlers: {},

    querySelector: selector =>
      selector.startsWith('#')
        ? byId(selector.slice(1))
        : null,

    querySelectorAll: selector => ({
      '.page': pages,
      '[data-route]': routes,
      '[data-go]': goButtons
    })[selector] || [],

    createElement: tag => new FakeElement(tag),

    addEventListener(name, fn) {
      (this.handlers[name] ??= []).push(fn);
    },

    fire(name, event) {
      for (const fn of this.handlers[name] ?? []) {
        fn(event);
      }
    },

    getElementById: byId
  };

  const win = {
    handlers: {},
    scrollTo() {},
    confirm: () => true,

    addEventListener(name, fn) {
      (this.handlers[name] ??= []).push(fn);
    },

    fire(name, evt) {
      for (const fn of this.handlers[name] ?? []) {
        fn(evt);
      }
    }
  };

  let confirmAnswer = true;
  win.confirm = () => confirmAnswer;

  const location = { hash: '#inicio' };

  const storageApi = {
    getItem: k => storage.has(k) ? storage.get(k) : null,

    setItem(k, v) {
      if (failSave) {
        throw Error('Quota');
      }
      storage.set(k, String(v));
    }
  };

  globalThis.document = document;
  globalThis.window = win;
  globalThis.location = location;
  globalThis.localStorage = storageApi;
  globalThis.confirm = () => confirmAnswer;

  globalThis.URL = {
    createObjectURL: () => 'blob:demo',
    revokeObjectURL() {}
  };

  globalThis.Blob = class {
    constructor(parts, options) {
      this.parts = parts;
      this.options = options;
    }
  };

  delete require.cache[require.resolve(appFile)];

  try {
    require(appFile);
  } catch (error) {
    restore();
    throw error;
  }

  function restore() {
    delete require.cache[require.resolve(appFile)];

    for (const name of globals) {
      if (original[name] === undefined) {
        delete globalThis[name];
      } else {
        globalThis[name] = original[name];
      }
    }
  }

  return {
    byId,
    pages,
    routes,
    document,
    window: win,
    location,
    storage,
    restore,

    setConfirm(v) {
      confirmAnswer = v;
    },

    saved() {
      return JSON.parse(
        storage.get('portal_hidrolandia_atividades_v2') || '[]'
      );
    },

    fill({
      title = 'Reunião',
      date = '2099-06-20',
      time = '14:30',
      place = 'Centro',
      description = 'Pauta comunitária'
    } = {}) {
      const x = {
        title,
        date,
        time,
        place,
        description
      };

      for (const [name, value] of Object.entries(x)) {
        byId('ev-' + name).value = value;
      }
    },

    submit() {
      let prevented = false;

      byId('event-form').fire('submit', {
        preventDefault() {
          prevented = true;
        }
      });

      return prevented;
    }
  };
}

function withApp(options, fn) {
  const app = startApp(options);

  try {
    fn(app);
  } finally {
    app.restore();
  }
}

const sample = {
  id: 'evt-1',
  title: 'Mutirão',
  date: '2099-05-12',
  time: '09:00',
  place: 'Praça',
  description: 'Limpeza'
};

// TESTE 1
test('inicia a página inicial e métricas sem eventos', () =>
  withApp({}, a => {
    assert.match(a.document.title, /Início/);
    assert.equal(a.byId('metric-total').textContent, '0');
    assert.equal(a.byId('metric-future').textContent, '0');

    assert.match(
      a.byId('featured-event').children[0].children[0].textContent,
      /não existem/
    );
  })
);

// TESTE 2
test('carrega eventos válidos e ignora registros inválidos', () =>
  withApp({ savedEvents: [sample, {}, null] }, a => {
    assert.equal(a.byId('metric-total').textContent, '1');
    assert.equal(a.byId('metric-future').textContent, '1');

    assert.equal(
      a.byId('featured-event').children[1].children[0].textContent,
      'Mutirão'
    );
  })
);

// TESTE 3
test('tolera dados locais JSON corrompidos', () =>
  withApp({ storedRaw: 'não é JSON' }, a => {
    assert.equal(a.byId('metric-total').textContent, '0');
  })
);

// TESTE 4
test('abre e fecha menu com Escape', () =>
  withApp({}, a => {
    a.byId('menu-trigger').fire('click');

    assert.equal(
      a.byId('sidebar').classList.contains('open'),
      true
    );

    assert.equal(
      a.byId('menu-trigger').getAttribute('aria-expanded'),
      'true'
    );

    a.document.fire('keydown', { key: 'Escape' });

    assert.equal(
      a.byId('sidebar').classList.contains('open'),
      false
    );

    assert.equal(a.byId('overlay').hidden, true);

    assert.equal(
      a.byId('menu-trigger').getAttribute('aria-expanded'),
      'false'
    );
  })
);

// TESTE 5
test('navegação seleciona página e atualiza título', () =>
  withApp({}, a => {
    a.location.hash = '#eventos';
    a.window.fire('hashchange');

    assert.match(a.document.title, /Eventos/);

    assert.equal(
      a.pages.find(x => x.dataset.page === 'eventos').hidden,
      false
    );

    assert.equal(
      a.routes.find(x => x.dataset.route === 'eventos')
        .getAttribute('aria-current'),
      'page'
    );

    a.location.hash = '#inexistente';
    a.window.fire('hashchange');

    assert.match(a.document.title, /Início/);
  })
);

// TESTE 6
test('abre e cancela formulário de atividade', () =>
  withApp({}, a => {
    a.byId('create-event').fire('click');

    assert.equal(a.byId('event-editor').hidden, false);
    assert.equal(a.byId('ev-title').focused, true);

    a.byId('cancel-event').fire('click');

    assert.equal(a.byId('event-editor').hidden, true);
  })
);

// TESTE 7
test('valida formulário vazio', () =>
  withApp({}, a => {
    assert.equal(a.submit(), true);
    assert.equal(a.saved().length, 0);

    assert.match(
      a.byId('toast').textContent,
      /Preencha todos/
    );

    assert.equal(
      a.byId('toast').classList.contains('error'),
      true
    );
  })
);

// TESTE 8
test('rejeita data impossível e horário inválido', () =>
  withApp({}, a => {
    a.fill({ date: '2099-02-30' });
    a.submit();
    assert.equal(a.saved().length, 0);

    a.fill({ time: '35:90' });
    a.submit();
    assert.equal(a.saved().length, 0);

    assert.match(
      a.byId('toast').textContent,
      /Verifique/
    );
  })
);

// TESTE 9
test('rejeita data passada', () =>
  withApp({}, a => {
    a.fill({ date: '2020-01-01' });
    a.submit();

    assert.equal(a.saved().length, 0);

    assert.match(
      a.byId('toast').textContent,
      /hoje em diante/
    );
  })
);

// TESTE 10
test('rejeita campos acima do limite', () =>
  withApp({}, a => {
    a.fill({ title: 'X'.repeat(86) });
    a.submit();

    assert.equal(a.saved().length, 0);
  })
);

// TESTE 11
test('cadastra e renderiza atividade válida', () =>
  withApp({}, a => {
    a.fill();
    a.submit();

    assert.equal(a.saved().length, 1);
    assert.equal(a.saved()[0].title, 'Reunião');
    assert.equal(a.byId('metric-total').textContent, '1');
    assert.equal(a.byId('event-form').wasReset, true);

    assert.match(
      a.byId('toast').textContent,
      /cadastrada/
    );
  })
);

// TESTE 12
test('pesquisa atividades pelo título', () =>
  withApp({ savedEvents: [sample] }, a => {
    a.location.hash = '#eventos';
    a.window.fire('hashchange');

    a.byId('event-search').value = 'mutir';
    a.byId('event-search').fire('input');

    assert.equal(
      a.byId('events-list').children.length,
      1
    );

    a.byId('event-search').value = 'inexistente';
    a.byId('event-search').fire('input');

    assert.match(
      a.byId('events-list').children[0].textContent,
      /Nenhuma atividade encontrada/
    );
  })
);

// TESTE 13
test('exclui atividade após confirmação', () =>
  withApp({ savedEvents: [sample] }, a => {
    a.location.hash = '#eventos';
    a.window.fire('hashchange');

    const button = a.byId('events-list')
      .children[0].children[2].children[0];

    a.setConfirm(false);
    button.fire('click');

    assert.equal(a.saved().length, 1);

    a.setConfirm(true);
    button.fire('click');

    assert.equal(a.saved().length, 0);
  })
);

// TESTE 14
test('alterna tema e persiste preferência', () =>
  withApp({}, a => {
    a.byId('theme-toggle').fire('click');

    assert.equal(
      a.document.body.classList.contains('dark'),
      true
    );

    assert.equal(
      a.storage.get('portal_hidrolandia_tema_v1'),
      'dark'
    );

    assert.equal(
      a.byId('theme-toggle').getAttribute('aria-pressed'),
      'true'
    );
  })
);

// TESTE 15
test('trata falha ao salvar atividades', () =>
  withApp({ failSave: true }, a => {
    a.fill();
    a.submit();

    assert.equal(a.saved().length, 0);

    assert.match(
      a.byId('toast').textContent,
      /Não foi possível salvar/
    );
  })
);

// TESTE 16
test('notificação esclarece que é protótipo', () =>
  withApp({}, a => {
    a.byId('notification-btn').fire('click');

    assert.match(
      a.byId('toast').textContent,
      /protótipo acadêmico/
    );
  })
);

// TESTE 17
test('limpar registros pede confirmação', () =>
  withApp({ savedEvents: [sample] }, a => {
    a.setConfirm(false);
    a.byId('clear-events').fire('click');

    assert.equal(a.saved().length, 1);

    a.setConfirm(true);
    a.byId('clear-events').fire('click');

    assert.equal(a.saved().length, 0);
  })
);
