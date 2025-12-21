(function () {
  try {
    var params = new URLSearchParams(window.location.search || '');
    var urlToken = params.get('token');
    if (urlToken) {
      localStorage.setItem('auth_token', urlToken);
      params.delete('token');
      var next = window.location.pathname;
      var qs = params.toString();
      if (qs) next += '?' + qs;
      if (window.location.hash) next += window.location.hash;
      window.history.replaceState({}, document.title, next);
    }
  } catch (e) {}

  var token = null;
  try {
    token = localStorage.getItem('auth_token');
  } catch (e) {}

  var isAuthed = Boolean(token);
  var pathname = String(window.location.pathname || '');
  var lowerPath = pathname.toLowerCase();
  var isPagesPath = lowerPath.indexOf('/pages/') !== -1;

  if (isAuthed) {
    var isAuthPage =
      lowerPath.endsWith('/login.html') ||
      lowerPath.endsWith('/signup.html') ||
      lowerPath === '/login' ||
      lowerPath === '/signup';

    if (isAuthPage) {
      var redirectHref = isPagesPath ? 'features.html' : 'pages/features.html';
      window.location.replace(redirectHref);
      return;
    }
  }

  if (!isAuthed) return;

  var homeHref = isPagesPath ? '../index.html' : 'index.html';

  function setupLogout(anchor) {
    if (!anchor) return;
    anchor.textContent = 'Logout';
    anchor.href = '#';
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      try {
        localStorage.removeItem('auth_token');
      } catch (err) {}
      window.location.href = homeHref;
    });
  }

  var navLogin = document.getElementById('nav-login');
  var navCta = document.getElementById('nav-cta');
  var mobileNavLogin = document.getElementById('mobile-nav-login');
  var mobileNavCta = document.getElementById('mobile-nav-cta');

  setupLogout(navLogin);
  setupLogout(mobileNavLogin);

  if (navCta && navCta.classList) navCta.classList.add('hidden');
  if (mobileNavCta && mobileNavCta.classList) mobileNavCta.classList.add('hidden');
})();
