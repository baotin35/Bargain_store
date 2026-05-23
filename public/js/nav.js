(function () {
  const page = location.pathname.split('/').pop();
  const links = [
    { href: 'dashboard.html',  icon: '📊', label: 'Dashboard' },
    { href: 'inventory.html',  icon: '📦', label: 'Inventory' },
    { href: 'checkout.html',   icon: '🛒', label: 'Checkout / POS' },
    { href: 'invoice.html',    icon: '🧾', label: 'Invoice' },
    { href: 'payables.html',   icon: '💸', label: 'Accounts Payable' },
    { href: 'receivables.html',icon: '💰', label: 'Accounts Receivable' },
    { href: 'members.html',    icon: '👥', label: 'Members' },
    { href: 'marketing.html',  icon: '📣', label: 'Marketing' },
    { href: 'settings.html',   icon: '⚙️', label: 'Settings' },
  ];

  const nav = links.map(l =>
    `<a href="${l.href}" class="${l.href === page ? 'active' : ''}">
      <span class="icon">${l.icon}</span>${l.label}
    </a>`
  ).join('');

  document.write(`
    <aside class="sidebar">
      <div class="sidebar-brand">🏪 Mom and Pop</div>
      <nav>${nav}</nav>
      <div class="sidebar-footer">
        <button onclick="fetch('/api/auth/logout',{method:'POST',credentials:'same-origin'}).then(()=>location.href='index.html')">
          🚪 Logout
        </button>
      </div>
    </aside>
  `);
})();
