# Portal Comunitário de Hidrolândia — MVP Premium

Protótipo acadêmico de uma plataforma web para organização de atividades e divulgação de informações comunitárias, baseado na referência visual fornecida pelo autor do projeto.

## Abrir no VS Code

1. Extraia o ZIP.
2. Abra **File > Open Folder** e selecione `Portal-Hidrolandia-Premium`.
3. Abra `index.html` no navegador (duplo clique no Explorador de Arquivos) ou use a extensão Live Server.
4. Não é necessário instalar dependências, rodar Node ou configurar banco de dados.

## Principais recursos

- Página inicial, menu lateral e rodapé institucional responsivo.
- Cadastro, busca, listagem e exclusão de atividades comunitárias.
- Dashboard atualizado com quantidades reais **apenas do navegador**.
- Notícias ilustrativas, serviços planejados e informações institucionais.
- Tema claro/escuro, exportação JSON e limpeza dos dados locais.
- Navegação por teclado, skip link, rotulagem de campos e foco visível.

## Segurança, privacidade e escopo

**Este site NÃO é um portal oficial.** Não contém contas de usuários, login, serviços de denúncia, banco de dados remoto ou autenticação. Use **somente dados fictícios**: informações são salvas em `localStorage` do navegador e podem ser vistas por outras pessoas que utilizem o mesmo perfil e dispositivo. Não use para dados pessoais ou sensíveis.

Notícias, imagens, logotipo e textos são ilustrativos. O recorte fotográfico foi extraído da imagem de referência fornecida pelo usuário; antes de uso público, confirmar direitos de uso da foto, logotipo, nome institucional e texto de direitos autorais. Estatísticas do painel não representam dados reais da associação.

Para publicar dados reais, serão necessários backend, banco de dados, autenticação, regras de acesso, medidas de LGPD e validação da entidade parceira.

## Estrutura

```
Portal-Hidrolandia-Premium/
├── index.html
├── style.css
├── script.js
├── README.md
├── .gitignore
└── assets/
    ├── marca.svg
    └── hidrolandia-referencia.jpg
```

## Enviar ao GitHub pelo VS Code

1. Abra a pasta extraída no VS Code.
2. Clique em **Source Control / Controle do Código-Fonte** na lateral.
3. Clique em **Initialize Repository**.
4. Adicione os arquivos, descreva o commit (por exemplo: `Cria MVP do portal comunitário`) e clique em **Commit**.
5. Clique em **Publish Branch / Publish to GitHub** e faça login.
6. Escolha um repositório público ou privado. Verifique a publicação na sua conta.

Alternativa pelo terminal (substitua `SEU-USUARIO`; crie no GitHub um repositório vazio, sem README inicial):

```sh
git init
git add .
git commit -m "Cria MVP do portal comunitário"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/portal-comunitario-hidrolandia.git
git push -u origin main
```

## GitHub Pages (opcional)

No GitHub acesse **Settings > Pages > Build and deployment > Deploy from a branch** e selecione a branch `main` e a pasta `/ (root)`. A página estará disponível quando a publicação terminar. Confira direitos de uso da marca e foto antes de publicar.
