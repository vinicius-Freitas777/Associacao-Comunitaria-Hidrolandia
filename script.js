'use strict';
/* Projeto de demonstração: dados locais, sem servidor ou autenticação. */
const STORAGE = 'portal_hidrolandia_atividades_v2';
const THEME = 'portal_hidrolandia_tema_v1';
const PAGES = ['inicio','noticias','eventos','servicos','associados','manifestacoes','sobre','configuracoes'];
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

function toast(message, error = false) {
  const node = $('#toast'); node.textContent = message;
  node.classList.toggle('error', error); node.hidden = false;
  clearTimeout(toast.timer); toast.timer = setTimeout(() => { node.hidden = true; }, 4200);
}
function getEvents() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE) || '[]');
    return Array.isArray(data) ? data.filter(v => v && typeof v.id === 'string' && typeof v.title === 'string' && typeof v.date === 'string' && typeof v.place === 'string' && typeof v.time === 'string' && typeof v.description === 'string') : [];
  } catch { return []; }
}
function putEvents(data) {
  try { localStorage.setItem(STORAGE, JSON.stringify(data)); return true; }
  catch { toast('Não foi possível salvar os dados neste navegador.', true); return false; }
}
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function parseDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y,m,d] = s.split('-').map(Number), result = new Date(y,m-1,d);
  return result.getFullYear() === y && result.getMonth() === m-1 && result.getDate() === d ? result : null;
}
function niceDate(s) {
  const d = parseDate(s);
  return d ? new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'long',year:'numeric'}).format(d) : 'Data inválida';
}
function element(tag, className = '', value) {
  const item = document.createElement(tag); item.className = className;
  if (value !== undefined) item.textContent = value; // texto seguro, sem inserção de HTML do usuário
  return item;
}
function closeMenu() {
  $('#sidebar').classList.remove('open'); $('#overlay').classList.remove('visible');
  $('#overlay').hidden = true; $('#menu-trigger').setAttribute('aria-expanded','false');
  $('#menu-trigger').setAttribute('aria-label','Abrir menu');
}
function go(page) {
  const active = PAGES.includes(page) ? page : 'inicio';
  $$('.page').forEach(node => { node.hidden = node.dataset.page !== active; });
  $$('[data-route]').forEach(node => {
    const selected = node.dataset.route === active;
    node.classList.toggle('active',selected);
    if (selected) node.setAttribute('aria-current','page'); else node.removeAttribute('aria-current');
  });
  closeMenu();
  const labels = {inicio:'Início',noticias:'Notícias',eventos:'Eventos',servicos:'Serviços',associados:'Associados',manifestacoes:'Manifestações',sobre:'Sobre nós',configuracoes:'Configurações'};
  document.title = `${labels[active]} · Portal Comunitário de Hidrolândia`;
  if (active === 'eventos') renderEvents();
  window.scrollTo(0,0);
}
function renderMetrics() {
  const records = getEvents();
  const future = records.filter(a => `${a.date}T${a.time}` >= `${today()}T00:00`).sort((a,b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  $('#metric-total').textContent = $('#events-total').textContent = String(records.length);
  $('#metric-future').textContent = $('#events-future').textContent = String(future.length);
  const target = $('#featured-event'); target.replaceChildren();
  if (!future.length) {
    const container = element('div');
    container.append(element('p','', 'Ainda não existem atividades futuras cadastradas neste dispositivo.'));
    const action = element('button','link-btn','Cadastrar uma atividade →'); action.type = 'button';
    action.addEventListener('click',() => { location.hash = 'eventos'; openEditor(); });
    container.append(action); target.append(container); return;
  }
  const next = future[0], dt = parseDate(next.date);
  const datebox = element('div','date-tile');
  datebox.append(element('strong','',String(dt.getDate()).padStart(2,'0')),element('span','',new Intl.DateTimeFormat('pt-BR',{month:'short'}).format(dt).replace('.','').toUpperCase()));
  const desc = element('div'); desc.append(element('h3','',next.title),element('p','',`${next.place} · ${next.time}`));
  target.append(datebox,desc);
}
function renderEvents() {
  const q = $('#event-search').value.toLocaleLowerCase('pt-BR').trim();
  const list = $('#events-list'); list.replaceChildren();
  const records = getEvents().sort((a,b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const result = records.filter(r => `${r.title} ${r.place} ${r.description}`.toLocaleLowerCase('pt-BR').includes(q));
  if (!result.length) {
    list.append(element('div','empty',q ? 'Nenhuma atividade encontrada. Tente outra pesquisa.' : 'Nenhuma atividade cadastrada. Clique em “Nova atividade” para começar.'));
    return;
  }
  result.forEach(record => {
    const row = element('article','event-row');
    const dt = parseDate(record.date), tile = element('div','date-tile');
    tile.append(element('strong','',dt ? String(dt.getDate()).padStart(2,'0') : '—'),element('span','',dt ? new Intl.DateTimeFormat('pt-BR',{month:'short'}).format(dt).replace('.','').toUpperCase() : '—'));
    const info = element('div','event-info');
    info.append(element('h3','',record.title),element('p','',`${niceDate(record.date)} às ${record.time} · ${record.place}`),element('p','',record.description));
    const actions = element('div','event-actions'), remove = element('button','','Excluir');
    remove.type = 'button'; remove.setAttribute('aria-label',`Excluir a atividade ${record.title}`);
    remove.addEventListener('click',() => {
      if (!window.confirm(`Deseja excluir a atividade “${record.title}”?`)) return;
      if (putEvents(getEvents().filter(v => v.id !== record.id))) {
        renderMetrics(); renderEvents(); toast('Atividade excluída com sucesso.');
      }
    });
    actions.append(remove); row.append(tile,info,actions); list.append(row);
  });
}
function openEditor() {
  const editor = $('#event-editor'); editor.hidden = false;
  $('#ev-date').min = today(); $('#ev-title').focus();
  editor.scrollIntoView({behavior:'smooth',block:'start'});
}
function closeEditor() { $('#event-editor').hidden = true; $('#create-event').focus(); }
function saveNewEvent(event) {
  event.preventDefault();
  const fields = {
    title: $('#ev-title').value.trim(),date: $('#ev-date').value,
    time: $('#ev-time').value,place: $('#ev-place').value.trim(),
    description: $('#ev-description').value.trim()
  };
  if (Object.values(fields).some(v => !v)) { toast('Preencha todos os campos obrigatórios.',true); return; }
  if (fields.title.length > 85 || fields.place.length > 100 || fields.description.length > 500 || !parseDate(fields.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(fields.time)) {
    toast('Verifique os dados informados no formulário.',true); return;
  }
  if (fields.date < today()) { toast('Escolha uma data de hoje em diante.',true); $('#ev-date').focus(); return; }
  const uid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  if (!putEvents([...getEvents(),{...fields,id:uid}])) return;
  $('#event-form').reset(); $('#event-search').value = '';
  closeEditor(); renderEvents(); renderMetrics(); toast('Atividade cadastrada com sucesso!');
}
function setTheme(dark) {
  document.body.classList.toggle('dark',dark);
  $('#theme-toggle').textContent = dark ? 'Usar tema claro' : 'Ativar tema escuro';
  $('#theme-toggle').setAttribute('aria-pressed', String(dark));
  try { localStorage.setItem(THEME,dark ? 'dark' : 'light'); } catch {}
}
function exportEvents() {
  const blob = new Blob([JSON.stringify({projeto:'Portal Comunitário de Hidrolândia — protótipo acadêmico',exportadoEm:new Date().toISOString(),atividades:getEvents()},null,2)],{type:'application/json;charset=utf-8'});
  const url = URL.createObjectURL(blob); const a = element('a');
  a.href = url; a.download = 'atividades-hidrolandia-demo.json'; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url),1000); toast('Arquivo de demonstração exportado.');
}
$('#menu-trigger').addEventListener('click',() => {
  const open = !$('#sidebar').classList.contains('open');
  $('#sidebar').classList.toggle('open',open); $('#overlay').classList.toggle('visible',open);
  $('#overlay').hidden = !open; $('#menu-trigger').setAttribute('aria-expanded',String(open));
  $('#menu-trigger').setAttribute('aria-label',open ? 'Fechar menu' : 'Abrir menu');
});
$('#overlay').addEventListener('click',closeMenu);
document.addEventListener('keydown',e => { if (e.key === 'Escape') closeMenu(); });
window.addEventListener('hashchange',() => go(location.hash.slice(1)));
$$('[data-go]').forEach(btn => btn.addEventListener('click',() => { location.hash = btn.dataset.go; if (location.hash === `#${btn.dataset.go}`) go(btn.dataset.go); }));
$('#create-event').addEventListener('click',openEditor);
$('#close-event').addEventListener('click',closeEditor);
$('#cancel-event').addEventListener('click',closeEditor);
$('#event-form').addEventListener('submit',saveNewEvent);
$('#event-search').addEventListener('input',renderEvents);
$('#theme-toggle').addEventListener('click',() => setTheme(!document.body.classList.contains('dark')));
$('#export-events').addEventListener('click',exportEvents);
$('#clear-events').addEventListener('click',() => {
  if (!getEvents().length) { toast('Não há atividades cadastradas para remover.'); return; }
  if (!confirm('Excluir permanentemente todas as atividades deste navegador?')) return;
  if (putEvents([])) { renderMetrics(); renderEvents(); toast('Registros locais excluídos.'); }
});
$('#notification-btn').addEventListener('click',() => toast('Este é um protótipo acadêmico. Não há notificações reais.'));
$('#copyright-year').textContent = String(new Date().getFullYear());
try { setTheme(localStorage.getItem(THEME) === 'dark'); } catch { setTheme(false); }
go(location.hash.slice(1)); renderMetrics();


/* Acessibilidade: fechar o menu com Escape */
document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        const menu = document.getElementById("sidebar");

        if (menu && menu.classList.contains("open")) {
            menu.classList.remove("open");

            const overlay = document.getElementById("overlay");
            if (overlay) {
                overlay.hidden = true;
            }

            const botaoMenu = document.getElementById("menu-trigger");
            if (botaoMenu) {
                botaoMenu.setAttribute("aria-expanded", "false");
                botaoMenu.focus();
            }
        }
    }
});

/* Atalho de acessibilidade: tecla Escape */
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        const menu = document.getElementById("sidebar");
        const overlay = document.getElementById("overlay");
        const botao = document.getElementById("menu-trigger");

        if (menu && menu.classList.contains("open")) {
            menu.classList.remove("open");

            if (overlay) {
                overlay.hidden = true;
            }

            if (botao) {
                botao.setAttribute("aria-expanded", "false");
                botao.focus();
            }
        }
    }
});
