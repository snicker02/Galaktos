// Galaktos — responsive layout: phone mode docks the view and puts the tab bar under it.
const PHONE = '(max-width: 760px), (max-height: 500px) and (orientation: landscape)';

export function initLayout(app) {
  const mq = window.matchMedia(PHONE);
  const land = window.matchMedia('(orientation: landscape)');
  const apply = () => {
    const tabbed = mq.matches;
    document.body.classList.toggle('tabbed', tabbed);
    document.body.classList.toggle('land', tabbed && land.matches);
    requestAnimationFrame(() => app.resize());
  };
  const on = (m) => (m.addEventListener ? m.addEventListener('change', apply) : m.addListener(apply));
  on(mq); on(land);
  apply();
}
