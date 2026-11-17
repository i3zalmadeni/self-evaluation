/* تذييل موحّد للموقع ولوحة التحكم (نمط تذييل الخطط الذكية، والنسخة نفسها في كل أنظمة النواة الرقمية).
   يستبدل أي تذييل قديم (footer.credit) ويُضاف في لوحة التحكم داخل #shell كي لا يظهر قبل الدخول. */
(() => {
// ===== التذييل الموحّد لمنظومة النواة الرقمية (نمط تذييل الخطط الذكية) =====
// النسخة نفسها في كل الأنظمة؛ يختلف سطران فقط: اسم النظام ورابط «كيف بُني المشروع».
const UF_PROJECT = "التقويم المدرسي الذكي";
const UF_HOW_URL = "https://i3zalmadeni.netlify.app/projects";
const UF_ME_URL = "https://i3zalmadeni.netlify.app/me";
const UF_CSS = `footer.uf{--uf-navy:#102c3b;--uf-blue:#3f7592;--uf-teal:#39a6a3;--uf-orange:#f0a35e;border-top:1px solid var(--line,#e2edf1);background:var(--surface,#fff);color:var(--ink,#0d2b45);font-family:inherit;margin-top:clamp(44px,6vw,72px)}
footer.uf .uf-in{display:flex;align-items:center;justify-content:flex-start;gap:16px;flex-wrap:wrap;padding-block:16px}
footer.uf .uf-moe{display:flex;flex-direction:column;align-items:center;line-height:1.2;padding-inline-start:10px;border-inline-start:2px solid var(--uf-orange)}
footer.uf .uf-moe b{font-size:.9rem;font-weight:800}footer.uf .uf-moe small{font-size:.62rem;color:var(--muted,#71859a)}
footer.uf .uf-mid{flex:1;min-width:200px;display:flex;flex-direction:column;font-size:.84rem;color:var(--muted,#71859a);line-height:1.7}footer.uf .uf-mid b{color:var(--ink,#0d2b45);font-weight:800}
footer.uf .uf-end{display:flex;align-items:center;gap:10px;margin-inline-start:auto}
footer.uf .uf-card{display:inline-flex;align-items:center;gap:12px;padding:10px 16px 10px 12px;border-radius:18px;background:var(--uf-navy);color:#fff;box-shadow:0 10px 24px rgba(16,44,59,.18)}
footer.uf .uf-card:hover .uf-mark{transform:rotate(-12deg)}
footer.uf .uf-txt{display:flex;flex-direction:column;line-height:1.35}footer.uf .uf-txt small{font-size:.72rem;color:#9fd3d1;font-weight:500}footer.uf .uf-txt b{font-size:.95rem;font-weight:800;white-space:nowrap;color:#fff}
footer.uf .uf-sep{align-self:stretch;width:1px;background:linear-gradient(180deg,transparent,rgba(255,255,255,.35),transparent)}
footer.uf .uf-links{display:flex;flex-direction:column;gap:4px}
footer.uf .uf-links a{display:inline-flex;align-items:center;gap:7px;padding:4px 10px;border-radius:9px;color:#e6f1f5;font-weight:600;font-size:.82rem;text-decoration:none;white-space:nowrap;min-height:32px;transition:background .2s,color .2s}
footer.uf .uf-links a:hover{background:rgba(255,255,255,.1);color:var(--uf-orange)}footer.uf .uf-links a:focus-visible{outline:3px solid var(--uf-orange);outline-offset:2px}
footer.uf .uf-links svg{width:15px;height:15px;flex:none;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
footer.uf .uf-mark{width:46px;height:46px;flex:none;overflow:visible;transition:transform .4s}
footer.uf .uf-mark .bg{fill:#fff}footer.uf .uf-mark .ring{fill:none;stroke:var(--uf-teal);stroke-width:2;stroke-dasharray:3 4;transform-origin:24px 24px;animation:ufSpin 18s linear infinite}
footer.uf .uf-mark .t{fill:var(--uf-navy);font:700 20px Tajawal,sans-serif}footer.uf .uf-mark .dot{fill:var(--uf-orange);transform-origin:24px 24px;animation:ufOrbit 9s ease-in-out infinite}
@keyframes ufSpin{to{transform:rotate(360deg)}}@keyframes ufOrbit{0%,70%,100%{transform:rotate(0)}85%{transform:rotate(-40deg)}}
footer.uf .uf-ai{font-style:normal;font-size:.68em;font-weight:700;letter-spacing:.04em;color:#fff;background:linear-gradient(135deg,var(--uf-teal),var(--uf-blue) 60%,var(--uf-orange));padding:.12em .5em;border-radius:6px;vertical-align:.2em;display:inline-block;line-height:1.4}
@media (max-width:860px){footer.uf .uf-in{justify-content:center;text-align:center}footer.uf .uf-end{width:100%;justify-content:flex-end}}
@media (max-width:520px){footer.uf .uf-card{flex-wrap:wrap;row-gap:8px}footer.uf .uf-sep{display:none}footer.uf .uf-links{flex-direction:row;width:100%;justify-content:flex-end}footer.uf .uf-txt b{white-space:normal}}
@media (prefers-reduced-motion:reduce){footer.uf .uf-mark .ring,footer.uf .uf-mark .dot{animation:none}}
@media print{footer.uf{display:none}}`;
(function () { if (document.getElementById("uf-css")) return; const s = document.createElement("style"); s.id = "uf-css"; s.textContent = UF_CSS; document.head.appendChild(s); })();
const footerHTML = `<footer class="uf credit"><div class="wrap uf-in"><span class="uf-moe"><b>وزارة التعليم</b><small>Ministry of Education</small></span><div class="uf-mid"><b>مدرسة لبيد بن ربيعة المتوسطة</b><span>مدير المدرسة: خالد بن عبدالرحمن الباش</span><span>${UF_PROJECT} – 1448هـ</span></div><div class="uf-end"><div class="uf-card"><svg class="uf-mark" viewBox="0 0 48 48" aria-hidden="true"><circle class="bg" cx="24" cy="24" r="21"/><circle class="ring" cx="24" cy="24" r="15"/><text class="t" x="24" y="31" text-anchor="middle">ع</text><circle class="dot" cx="39" cy="10" r="4.5"/></svg><span class="uf-txt"><small>أحد منتجات</small><b>مختبر الأفكار — عبدالعزيز المديني <i class="uf-ai">AI</i></b></span><span class="uf-sep" aria-hidden="true"></span><span class="uf-links"><a href="${UF_ME_URL}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>تعرّف عليّ</a><a href="${UF_HOW_URL}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/></svg>كيف بُني المشروع</a></span></div></div></div></footer>`;
// ===== نهاية التذييل الموحّد =====

  const mount = () => {
    document.querySelectorAll('footer.credit').forEach(f => f.remove());
    const host = document.getElementById('shell') || document.body;
    host.insertAdjacentHTML('beforeend', footerHTML);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
