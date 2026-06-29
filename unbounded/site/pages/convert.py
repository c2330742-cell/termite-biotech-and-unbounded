#!/usr/bin/env python3
"""Convert markdown files to styled HTML pages for the UNBOUNDED site."""
import os, sys, re, markdown

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
SITE_ROOT = os.path.join(REPO_ROOT, 'unbounded', 'site')
OUTPUT_DIR = os.path.join(SITE_ROOT, 'pages')

TEMPLATE = r'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="{meta_desc}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{meta_desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="https://Puronbo.github.io/termite-biotech-and-unbounded/unbounded/site/pages/{rel_path}">
<meta property="og:image" content="https://raw.githubusercontent.com/Puronbo/termite-biotech-and-unbounded/main/unbounded/site/favicon.svg">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0e0e16">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<title>{title}</title>
<link rel="stylesheet" href="../styles.css">
<style>
h2 {{ font-size: 1.4rem; font-weight: 600; margin: 2rem 0 0.75rem; color: var(--fg); }}
h3 {{ font-size: 1.15rem; font-weight: 600; margin: 1.5rem 0 0.5rem; color: var(--accent3); }}
em {{ color: var(--muted); }}
a:focus-visible {{ outline: 2px solid var(--accent); outline-offset: 2px; }}
.skip-link:focus {{ top: 0; }}
</style>
</head>
<body>
<a href="#main-content" class="skip-link">Skip to content</a>
<div class="container" id="main-content">
<div class="top-nav">
  <a href="../../portal.html">&#9670; Portal</a>
  <span class="sep">/</span>
  <a href="{section_index}">{section_name}</a>
  <span class="sep">/</span>
  <span style="color:var(--fg)">{title_short}</span>
</div>
{content}
<div class="foot-nav">
  <a href="../../portal.html">&#9670; Back to Portal</a>
  <a href="https://github.com/Puronbo/termite-biotech-and-unbounded/blob/main/unbounded/{md_rel_path}" target="_blank">&#9998; Edit on GitHub</a>
  <a href="#">&#8593; Top</a>
</div>
</div>
<script>
(function(){{var p=location.pathname;var h=p.substring(p.lastIndexOf('/')+1);var r;try{{r=JSON.parse(localStorage.getItem('unbounded-history')||'[]')}}catch(e){{r=[]}};if(!r.includes(h)){{r.unshift(h);if(r.length>20)r.length=20;try{{localStorage.setItem('unbounded-history',JSON.stringify(r))}}catch(e){{}}}}}})();
(function(){{var u='https://aurxoemycvcywtdwahuc.supabase.co';var k='sb_publishable__bSnqp9ioikLs515Uxtudg_8HtvJPuE';var hd={{apikey:k,'Authorization':'Bearer '+k,'Content-Type':'application/json'}};var s;try{{s=localStorage.getItem('unbounded-session')}}catch(e){{s=''}};if(!s){{s='s_'+Date.now()+'_'+Math.random().toString(36).substr(2,9);try{{localStorage.setItem('unbounded-session',s)}}catch(e){{}}}};var pn=location.pathname.split('/').pop()||'index';fetch(u+'/rest/v1/page_views',{{method:'POST',headers:Object.assign({{Prefer:'return=minimal'}},hd),body:JSON.stringify({{page:pn,session_id:s}})}}).catch(function(){{}});fetch(u+'/rest/v1/sessions?on_conflict=id',{{method:'POST',headers:Object.assign({{Prefer:'resolution=merge-duplicates'}},hd),body:JSON.stringify({{id:s,last_active:new Date().toISOString()}})}}).catch(function(){{}});var lb;try{{lb=localStorage.getItem('unbounded-heartbeat')}}catch(e){{lb=''}};if(!lb||Date.now()-parseInt(lb)>86400000){{fetch(u+'/rest/v1/heartbeats',{{method:'POST',headers:Object.assign({{Prefer:'return=minimal'}},hd),body:'{{}}'}}).catch(function(){{}});try{{localStorage.setItem('unbounded-heartbeat',''+Date.now())}}catch(e){{}}}}}})();
</script>
</body>
</html>'''

def convert_file(md_path, output_rel):
    """Convert a markdown file to HTML."""
    with open(md_path, 'r', encoding='utf-8') as f:
        md_content = f.read()

    # Extract first h1 as title
    title_match = re.search(r'^#\s+(.+)$', md_content, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else os.path.splitext(os.path.basename(md_path))[0]
    title_short = title if len(title) < 50 else title[:47] + '...'
    meta_desc = title_short

    # Determine section
    rel_path = os.path.normpath(output_rel).replace('\\', '/')
    path_parts = rel_path.split('/')
    if len(path_parts) > 1:
        section = path_parts[0]
    else:
        section = ''

    section_names = {
        'docs': 'Documentation',
        'calls': 'Calls to Action',
        'termite': 'Termite Research',
        'unbounded': 'UNBOUNDED',
        'pest-control': 'Natural Pest Control',
        'termite-farming': 'Termite Farming',
        'chronosend': 'ChronoSend',
        '': '',
    }
    section_name = section_names.get(section, section.capitalize())
    section_index = f'{section}/index.html' if section else '../portal.html'
    if section:
        section_index_path = os.path.join(os.path.dirname(rel_path), 'index.html')
        # Compute relative path for section index
        depth = rel_path.count('/')
        if depth > 1:
            section_index = '../' * (depth - 1) + section + '/index.html'

    # Convert markdown
    html_body = markdown.markdown(
        md_content,
        extensions=['fenced_code', 'tables', 'codehilite', 'nl2br', 'sane_lists']
    )

    # Fix relative image/links in markdown
    md_dir = os.path.dirname(md_path)
    html_body = re.sub(
        r'<a href="(?!https?://|#|/)([^"]+)">',
        lambda m: f'<a href="{m.group(1)}">',
        html_body
    )

    # Compute relative path from repo root for Edit on GitHub link
    try:
        md_rel_path = os.path.relpath(md_path, REPO_ROOT)
    except ValueError:
        md_rel_path = rel_path.replace('.html', '.md')
    md_rel_path = md_rel_path.replace('\\', '/')

    # Render template
    page = TEMPLATE.format(
        title=title, title_short=title_short, meta_desc=meta_desc,
        content=html_body, section_name=section_name,
        section_index=section_index, rel_path=rel_path.replace('\\', '/'),
        md_rel_path=md_rel_path
    )
    return page


DOC_DESCRIPTIONS = {
    'manifesto.html': 'The complete UNBOUNDED manifesto \u2014 11 categories of new media',
    'platform-blueprint.html': 'Technical architecture, AI orchestration, and system design',
    'roadmap.html': 'Development milestones and future plans',
    'open-letter.html': 'An invitation to join the unbinding of media',
    'for-developers.html': 'Technical contribution guide for engineers',
    'for-creatives.html': 'Creative opportunities in the UNBOUNDED ecosystem',
    'welcome.html': 'A guided tour of the UNBOUNDED project',
    'governance.html': 'Decentralized governance model and community framework',
    'contributing.html': 'How to contribute to UNBOUNDED',
    'master-summary.html': 'Comprehensive overview of the Termite Research Initiative',
    'cross-verification.html': 'Scientific validation of claims against literature',
    'readme.html': 'Introduction to the Termite Research project',
}

DOC_EMOJIS = {
    'manifesto.html': '\U0001f4dc',
    'platform-blueprint.html': '\U0001f3d7\ufe0f',
    'roadmap.html': '\U0001f5fa\ufe0f',
    'open-letter.html': '\u2709\ufe0f',
    'for-developers.html': '\U0001f4bb',
    'for-creatives.html': '\U0001f3a8',
    'welcome.html': '\U0001f44b',
    'governance.html': '\U0001f3db\ufe0f',
    'contributing.html': '\U0001f91d',
    'master-summary.html': '\U0001f4cb',
    'cross-verification.html': '\U0001f52c',
    'readme.html': '\U0001f4d6',
}

DOC_DESCRIPTIONS.update({
    # pest-control
    'manufacturing-guide.html': 'Complete manufacturing setup and protocols',
    'product-formulations.html': 'Product formulation recipes and specifications',
    'research-literature.html': 'Scientific research and literature review',
    'safety-data-sheets.html': 'Safety data sheets and handling guidelines',
    'implementation-timeline.html': '12-month implementation timeline and milestones',
    'manufacturing-setup.html': 'Manufacturing facility setup guide',
    'certification-roadmap.html': 'FDA and DENR certification roadmap',
    'formulation-recipes.html': 'Product formulation recipes and instructions',
    'marketing-strategy.html': 'Marketing strategy and brand development',
    'safety-testing.html': 'Safety testing protocols and procedures',
    'distribution-strategy.html': 'Distribution channel strategy and logistics',
    # termite-farming
    'market-analysis.html': 'Market analysis and commercial opportunities',
    'farming-methods.html': 'Termite farming methods and best practices',
    'processing-guide.html': 'Processing guide for termite products',
    'species-profiles.html': 'Species profiles and biological characteristics',
    'implementation-summary.html': 'Implementation summary and action plan',
    'colony-monitoring.html': 'Colony monitoring data and analysis',
    # chronosend
    'overview.html': 'Complete overview of ChronoSend — architecture, channels, quick start, and use cases.',
})

DOC_EMOJIS.update({
    # pest-control
    'manufacturing-guide.html': '\U0001f9ea',
    'product-formulations.html': '\U0001f9ea',
    'research-literature.html': '\U0001f9ea',
    'safety-data-sheets.html': '\U0001f9ea',
    'implementation-timeline.html': '\U0001f9ea',
    'manufacturing-setup.html': '\U0001f9ea',
    'certification-roadmap.html': '\U0001f9ea',
    'formulation-recipes.html': '\U0001f9ea',
    'marketing-strategy.html': '\U0001f9ea',
    'safety-testing.html': '\U0001f9ea',
    'distribution-strategy.html': '\U0001f9ea',
    # termite-farming
    'market-analysis.html': '\U0001f41c',
    'farming-methods.html': '\U0001f41c',
    'processing-guide.html': '\U0001f41c',
    'species-profiles.html': '\U0001f41c',
    'implementation-summary.html': '\U0001f41c',
    'colony-monitoring.html': '\U0001f41c',
    # chronosend
    'overview.html': '\u23f0',
})

DOC_READING_TIMES = {
    'manifesto.html': '15 min read',
    'platform-blueprint.html': '12 min read',
    'roadmap.html': '10 min read',
    'open-letter.html': '8 min read',
    'for-developers.html': '10 min read',
    'for-creatives.html': '8 min read',
    'welcome.html': '6 min read',
    'governance.html': '10 min read',
    'contributing.html': '7 min read',
    'master-summary.html': '20 min read',
    'cross-verification.html': '12 min read',
    'readme.html': '5 min read',
    # pest-control
    'manufacturing-guide.html': '12 min read',
    'product-formulations.html': '10 min read',
    'research-literature.html': '15 min read',
    'safety-data-sheets.html': '8 min read',
    'implementation-timeline.html': '10 min read',
    'manufacturing-setup.html': '12 min read',
    'certification-roadmap.html': '10 min read',
    'formulation-recipes.html': '8 min read',
    'marketing-strategy.html': '10 min read',
    'safety-testing.html': '8 min read',
    'distribution-strategy.html': '8 min read',
    # termite-farming
    'market-analysis.html': '10 min read',
    'farming-methods.html': '12 min read',
    'processing-guide.html': '10 min read',
    'species-profiles.html': '12 min read',
    'implementation-summary.html': '8 min read',
    'colony-monitoring.html': '10 min read',
    # chronosend
    'overview.html': '8 min read',
}


def generate_index(files, section_name, output_path):
    """Generate an index page for a section with rich card layout."""
    cards = []
    for f in files:
        basename = os.path.splitext(os.path.basename(f))[0]
        label = basename.replace('-', ' ').replace('_', ' ').title()
        emoji = DOC_EMOJIS.get(f, '\U0001f4c4')
        desc = DOC_DESCRIPTIONS.get(f, '')
        reading_time = DOC_READING_TIMES.get(f, '')
        cards.append(f'''
    <a href="{f}" class="doc-item">
      <span class="doc-icon">{emoji}</span>
      <span class="doc-info">
        <span class="doc-title">{label}</span>
        <span class="doc-desc">{desc}</span>
        <span class="doc-meta">{reading_time}</span>
      </span>
    </a>''')

    cards_html = '\n'.join(cards)

    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{section_name} &mdash; UNBOUNDED</title>
<meta name="description" content="{section_name} \u2014 documents and resources from the UNBOUNDED project.">
<meta property="og:title" content="{section_name} &mdash; UNBOUNDED">
<meta property="og:description" content="{section_name} \u2014 documents and resources from the UNBOUNDED project.">
<meta property="og:type" content="website">
<meta property="og:image" content="https://raw.githubusercontent.com/Puronbo/termite-biotech-and-unbounded/main/unbounded/site/favicon.svg">
<meta name="theme-color" content="#0e0e16">
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<link rel="stylesheet" href="../styles.css">
<style>
.doc-list {{ display: flex; flex-direction: column; gap: 0.75rem; }}
.doc-item {{ display: flex; align-items: flex-start; gap: 1rem; padding: 1.25rem 1.5rem; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: var(--radius); text-decoration: none; color: var(--fg); transition: background 0.3s ease, border-color 0.3s ease, transform 0.3s ease; }}
.doc-item:hover {{ background: rgba(255,255,255,0.05); border-color: var(--accent2); transform: translateX(4px); }}
.doc-item .doc-icon {{ font-size: 1.5rem; flex-shrink: 0; margin-top: 0.1rem; }}
.doc-item .doc-info {{ flex: 1; }}
.doc-item .doc-title {{ font-weight: 600; font-size: 1rem; margin-bottom: 0.2rem; }}
.doc-item .doc-desc {{ font-size: 0.8rem; color: var(--muted); line-height: 1.4; }}
.doc-item .doc-meta {{ font-size: 0.7rem; color: var(--muted-dim); margin-top: 0.3rem; font-family: var(--font-mono); }}
.sub {{ color: var(--muted); margin-bottom: 2rem; font-size: 0.95rem; }}
.back-link {{ display: inline-block; margin-bottom: 1.5rem; color: var(--accent); text-decoration: none; font-size: 0.85rem; }}
.back-link:hover {{ color: var(--accent2); }}
.skip-link:focus {{ top: 0; }}
</style>
</head>
<body>
<a href="#main-content" class="skip-link">Skip to content</a>
<div class="container container-sm" id="main-content">
<a class="back-link" href="../../portal.html">&#9664; Back to Portal</a>
<h1>{section_name}</h1>
<p class="sub">Browse documents in this section.</p>
<div class="doc-list">{cards_html}</div>
</div>
</body>
</html>'''
    return html


def main():
    # Define all markdown files to convert
    conversions = [
        # (source_md, output_relative_path)
    ]

    # unbounded/docs/
    docs_dir = os.path.join(REPO_ROOT, 'unbounded', 'docs')
    conversions += [
        (os.path.join(docs_dir, 'MANIFESTO.md'), 'docs/manifesto.html'),
        (os.path.join(docs_dir, 'PLATFORM-BLUEPRINT.md'), 'docs/platform-blueprint.html'),
        (os.path.join(docs_dir, 'ROADMAP.md'), 'docs/roadmap.html'),
    ]

    # unbounded/calls/
    calls_dir = os.path.join(REPO_ROOT, 'unbounded', 'calls')
    conversions += [
        (os.path.join(calls_dir, 'OPEN-LETTER.md'), 'calls/open-letter.html'),
        (os.path.join(calls_dir, 'FOR-DEVELOPERS.md'), 'calls/for-developers.html'),
        (os.path.join(calls_dir, 'FOR-CREATIVES.md'), 'calls/for-creatives.html'),
    ]

    # unbounded/ root
    ub_root = os.path.join(REPO_ROOT, 'unbounded')
    conversions += [
        (os.path.join(ub_root, 'WELCOME.md'), 'unbounded/welcome.html'),
        (os.path.join(ub_root, 'GOVERNANCE.md'), 'unbounded/governance.html'),
        (os.path.join(ub_root, 'CONTRIBUTING.md'), 'unbounded/contributing.html'),
    ]

    # termite-projects/natural-pest-control/
    npc_dir = os.path.join(REPO_ROOT, 'termite-projects', 'natural-pest-control')
    conversions += [
        (os.path.join(npc_dir, 'README.md'), 'pest-control/readme.html'),
        (os.path.join(npc_dir, 'docs', 'manufacturing-guide.md'), 'pest-control/manufacturing-guide.html'),
        (os.path.join(npc_dir, 'docs', 'product-formulations.md'), 'pest-control/product-formulations.html'),
        (os.path.join(npc_dir, 'docs', 'research-literature.md'), 'pest-control/research-literature.html'),
        (os.path.join(npc_dir, 'docs', 'safety-data-sheets.md'), 'pest-control/safety-data-sheets.html'),
        (os.path.join(npc_dir, 'implementation', '12-month-implementation-timeline.md'), 'pest-control/implementation-timeline.html'),
        (os.path.join(npc_dir, 'implementation', 'manufacturing-setup-guide.md'), 'pest-control/manufacturing-setup.html'),
        (os.path.join(npc_dir, 'implementation', 'fda-denr-certification-roadmap.md'), 'pest-control/certification-roadmap.html'),
        (os.path.join(npc_dir, 'implementation', 'product-formulation-recipes.md'), 'pest-control/formulation-recipes.html'),
        (os.path.join(npc_dir, 'implementation', 'marketing-strategy-brand-development.md'), 'pest-control/marketing-strategy.html'),
        (os.path.join(npc_dir, 'implementation', 'safety-testing-protocols.md'), 'pest-control/safety-testing.html'),
        (os.path.join(npc_dir, 'implementation', 'distribution-channel-strategy.md'), 'pest-control/distribution-strategy.html'),
    ]

    # termite-projects/termite-farming/
    tf_dir = os.path.join(REPO_ROOT, 'termite-projects', 'termite-farming')
    conversions += [
        (os.path.join(tf_dir, 'README.md'), 'termite-farming/readme.html'),
        (os.path.join(tf_dir, 'business', 'market-analysis.md'), 'termite-farming/market-analysis.html'),
        (os.path.join(tf_dir, 'docs', 'farming-methods.md'), 'termite-farming/farming-methods.html'),
        (os.path.join(tf_dir, 'docs', 'processing-guide.md'), 'termite-farming/processing-guide.html'),
        (os.path.join(tf_dir, 'docs', 'species-profiles.md'), 'termite-farming/species-profiles.html'),
        (os.path.join(tf_dir, 'implementation', 'IMPLEMENTATION-SUMMARY.md'), 'termite-farming/implementation-summary.html'),
        (os.path.join(tf_dir, 'research', 'colony-monitoring-data.md'), 'termite-farming/colony-monitoring.html'),
    ]

    # termite-projects/ root
    tp_root = os.path.join(REPO_ROOT, 'termite-projects')
    conversions += [
        (os.path.join(tp_root, 'MASTER-PROJECT-SUMMARY.md'), 'termite/master-summary.html'),
        (os.path.join(tp_root, 'CROSS-VERIFICATION.md'), 'termite/cross-verification.html'),
        (os.path.join(tp_root, 'README.md'), 'termite/readme.html'),
    ]

    # Create output directories
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    for _, rel in conversions:
        dirname = os.path.join(OUTPUT_DIR, os.path.dirname(rel))
        os.makedirs(dirname, exist_ok=True)

    # Convert each file
    print(f"Converting {len(conversions)} files...")
    for md_path, rel_path in conversions:
        if not os.path.exists(md_path):
            print(f"  SKIP (not found): {md_path}")
            continue
        try:
            page = convert_file(md_path, rel_path)
            out_path = os.path.join(OUTPUT_DIR, rel_path)
            with open(out_path, 'w', encoding='utf-8') as f:
                f.write(page)
            size = len(page)
            print(f"  OK: {rel_path} ({size} bytes)")
        except Exception as e:
            print(f"  ERROR: {rel_path}: {e}")

    # Generate index pages
    index_configs = [
        ('docs', 'Documentation', ['manifesto.html', 'platform-blueprint.html', 'roadmap.html']),
        ('calls', 'Calls to Action', ['open-letter.html', 'for-developers.html', 'for-creatives.html']),
        ('unbounded', 'UNBOUNDED Project', ['welcome.html', 'governance.html', 'contributing.html']),
        ('termite', 'Termite Research', ['master-summary.html', 'cross-verification.html', 'readme.html']),
        ('pest-control', 'Natural Pest Control', ['readme.html', 'manufacturing-guide.html', 'product-formulations.html', 'research-literature.html', 'safety-data-sheets.html', 'implementation-timeline.html', 'manufacturing-setup.html', 'certification-roadmap.html', 'formulation-recipes.html', 'marketing-strategy.html', 'safety-testing.html', 'distribution-strategy.html']),
        ('termite-farming', 'Termite Farming', ['readme.html', 'market-analysis.html', 'farming-methods.html', 'processing-guide.html', 'species-profiles.html', 'implementation-summary.html', 'colony-monitoring.html']),
        ('chronosend', 'ChronoSend', ['overview.html']),
    ]
    for section, name, files in index_configs:
        html = generate_index(files, name, section)
        out_path = os.path.join(OUTPUT_DIR, section, 'index.html')
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"  INDEX: {section}/index.html")

    # Generate root pages index
    SECTION_META = {
        'docs': ('\U0001f4c4', 'Core UNBOUNDED documentation including the manifesto, platform blueprint, and roadmap.'),
        'calls': ('\U0001f4e2', 'Calls to action for developers, creatives, and the broader community.'),
        'unbounded': ('\U0001f310', 'Project overview, governance model, and contribution guidelines.'),
        'termite': ('\U0001f52c', 'Scientific research documentation from the Termite Research Initiative.'),
        'pest-control': ('\U0001f9ea', 'Natural pest control solutions, manufacturing guides, and certification roadmaps.'),
        'termite-farming': ('\U0001f41c', 'Termite farming methods, market analysis, and species profiles.'),
        'chronosend': ('\u23f0', 'A timed messaging application for cross-platform communication.'),
    }
    all_sections = []
    for section, name, files in index_configs:
        emoji, desc = SECTION_META.get(section, ('\U0001f4c4', ''))
        count = len(files)
        count_label = f'{count} document{"s" if count != 1 else ""}'
        all_sections.append(f'<tr><td><span style="font-size:1.2rem;margin-right:0.5rem">{emoji}</span><a href="{section}/index.html" style="font-size:1rem;font-weight:600">{name}</a><br><span style="color:var(--muted);font-size:0.8rem;line-height:1.4">{desc}</span></td><td style="color:var(--muted-dim);font-size:0.8rem;white-space:nowrap;vertical-align:middle;font-family:var(--font-mono)">{count_label}</td></tr>')
    rows = '\n'.join(all_sections)
    root_index = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Documentation &mdash; UNBOUNDED + Termite Research</title>
<meta name="description" content="All project documents across UNBOUNDED, Termite Research, and Calls sections.">
<meta property="og:title" content="Documentation &mdash; UNBOUNDED + Termite Research">
<meta property="og:description" content="All project documents across UNBOUNDED, Termite Research, and Calls sections.">
<meta property="og:type" content="website">
<meta property="og:image" content="https://raw.githubusercontent.com/Puronbo/termite-biotech-and-unbounded/main/unbounded/site/favicon.svg">
<meta name="theme-color" content="#0e0e16">
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<link rel="stylesheet" href="../styles.css">
<style>
.sub {{ color: var(--muted); margin-bottom: 2rem; font-size: 0.95rem; }}
.back-link {{ display: inline-block; margin-bottom: 1.5rem; color: var(--accent); text-decoration: none; font-size: 0.85rem; }}
.back-link:hover {{ color: var(--accent2); }}
td {{ padding: 0.9rem 0; border-bottom: 1px solid var(--border); vertical-align: top; }}
td a {{ color: var(--accent); text-decoration: none; }}
td a:hover {{ color: var(--accent2); }}
.skip-link:focus {{ top: 0; }}
</style>
</head>
<body>
<a href="#main-content" class="skip-link">Skip to content</a>
<div class="container container-sm" id="main-content">
<a class="back-link" href="../portal.html">&#9664; Back to Portal</a>
<h1>Documentation</h1>
<p class="sub">All project documents, organized by section.</p>
<table>{rows}</table>
</div>
</body>
</html>'''
    with open(os.path.join(OUTPUT_DIR, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(root_index)
    print(f"  INDEX: index.html (root pages index)")

    print(f"\nAll done. Files written to: {OUTPUT_DIR}")


if __name__ == '__main__':
    main()
