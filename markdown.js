(() => {
  const cssEscape = (window.CSS && CSS.escape) ? CSS.escape : (value) => String(value).replace(/["'\\#.:?&=\[\]()/\s]/g, '\\$&');

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function inlineMarkdown(text = '') {
    let out = escapeHtml(text);
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    return out;
  }

  function slugify(text, index) {
    const slug = String(text || '').trim().toLowerCase()
      .replace(/[`*_~#\[\]()]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w\u4e00-\u9fa5-]+/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return slug || `section-${index}`;
  }

  function markdownToHtml(markdown = '') {
    const lines = String(markdown).replace(/\r\n?/g, '\n').split('\n');
    const html = [];
    const headings = [];
    let paragraph = [];
    let listType = null;
    let blockquote = [];
    let code = [];
    let inCode = false;
    let codeLang = '';
    let headingIndex = 0;

    const closeParagraph = () => {
      if (!paragraph.length) return;
      html.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
      paragraph = [];
    };
    const closeList = () => {
      if (!listType) return;
      html.push(`</${listType}>`);
      listType = null;
    };
    const closeBlockquote = () => {
      if (!blockquote.length) return;
      html.push(`<blockquote>${blockquote.map(inlineMarkdown).join('<br>')}</blockquote>`);
      blockquote = [];
    };

    for (const line of lines) {
      const raw = line;
      const trimmed = raw.trim();
      const fence = trimmed.match(/^```\s*([^`]*)$/);
      if (fence) {
        if (inCode) {
          html.push(`<pre><code${codeLang ? ` data-lang="${escapeHtml(codeLang)}"` : ''}>${escapeHtml(code.join('\n'))}</code></pre>`);
          code = []; inCode = false; codeLang = '';
        } else {
          closeParagraph(); closeList(); closeBlockquote();
          inCode = true; codeLang = fence[1] || '';
        }
        continue;
      }
      if (inCode) { code.push(raw); continue; }
      if (!trimmed) { closeParagraph(); closeList(); closeBlockquote(); continue; }
      const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        closeParagraph(); closeList(); closeBlockquote();
        const level = heading[1].length;
        const text = heading[2].replace(/\s+#+$/, '');
        const id = slugify(text, ++headingIndex);
        headings.push({ level, text, id });
        html.push(`<h${level} id="${id}">${inlineMarkdown(text)}</h${level}>`);
        continue;
      }
      const quote = trimmed.match(/^>\s?(.*)$/);
      if (quote) { closeParagraph(); closeList(); blockquote.push(quote[1]); continue; }
      const unordered = trimmed.match(/^[-*+]\s+(.+)$/);
      const ordered = trimmed.match(/^\d+[.)]\s+(.+)$/);
      if (unordered || ordered) {
        closeParagraph(); closeBlockquote();
        const type = ordered ? 'ol' : 'ul';
        if (listType && listType !== type) closeList();
        if (!listType) { listType = type; html.push(`<${type}>`); }
        html.push(`<li>${inlineMarkdown((unordered || ordered)[1])}</li>`);
        continue;
      }
      closeList(); closeBlockquote();
      paragraph.push(trimmed);
    }
    closeParagraph(); closeList(); closeBlockquote();
    if (inCode) html.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
    return { html: html.join('\n'), headings };
  }

  function titleFromPath(pathname) {
    const name = decodeURIComponent(pathname.split('/').filter(Boolean).pop() || 'README.md');
    return name.replace(/\.md$/i, '').replace(/[-_]/g, ' ') || 'Markdown 文档';
  }

  function renderMarkdownPage(markdown, sourcePath) {
    const parsed = markdownToHtml(markdown);
    const title = parsed.headings[0]?.text || titleFromPath(sourcePath);
    document.title = `${title} · 文档预览`;
    const toc = parsed.headings.filter(h => h.level <= 3).slice(0, 24).map(h =>
      `<a class="level${h.level}" href="#${cssEscape(h.id)}">${escapeHtml(h.text)}</a>`
    ).join('');
    document.body.classList.add('markdown-preview-body');
    document.getElementById('app').innerHTML = `
      <main class="mdShell">
        <aside class="mdToc">
          <a class="mdBack" href="/">← 返回原型</a>
          <strong>文档目录</strong>
          <nav>${toc || '<span>暂无标题</span>'}</nav>
        </aside>
        <article class="mdDoc">
          <div class="mdMeta"><span>Markdown Preview</span><a href="${sourcePath}?raw=1">查看原始 Markdown</a></div>
          ${parsed.html}
        </article>
      </main>`;
  }

  async function bootMarkdownPreview() {
    const path = location.pathname;
    const embedded = document.getElementById('md-source');
    if (embedded) {
      const markdown = JSON.parse(embedded.textContent || '""');
      renderMarkdownPage(markdown, path);
      return true;
    }
    if (!/\.md$/i.test(path) || /[?&]raw=1\b/.test(location.search)) return false;
    try {
      const res = await fetch(path, { headers: { Accept: 'text/markdown,text/plain,*/*' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const markdown = await res.text();
      renderMarkdownPage(markdown, path);
      return true;
    } catch (err) {
      document.body.classList.add('markdown-preview-body');
      document.getElementById('app').innerHTML = `<main class="mdShell single"><article class="mdDoc"><h1>文档加载失败</h1><p>无法读取 Markdown 文件：<code>${escapeHtml(path)}</code></p><pre><code>${escapeHtml(err.message || String(err))}</code></pre><p><a href="/">返回原型首页</a></p></article></main>`;
      return true;
    }
  }

  window.HermesMarkdownPreview = { boot: bootMarkdownPreview, markdownToHtml };
})();
