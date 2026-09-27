/**
 * HASH-BASED CLIENT-SIDE ROUTER
 */

export class Router {
  constructor(routes, app) {
    this.routes = routes;
    this.app = app;
    this.currentPath = '/';
    
    this.init();
  }

  init() {
    // Handle initial route
    window.addEventListener('hashchange', () => this.handleRoute());
    
    // Handle clicks on router links
    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-route]');
      if (link) {
        e.preventDefault();
        const route = link.getAttribute('data-route');
        window.location.hash = route;
      }
    });

    // Initial route
    this.handleRoute();
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    this.currentPath = hash;
    
    // Update nav active states
    document.querySelectorAll('.nav-link').forEach(link => {
      const route = link.getAttribute('data-route');
      if (hash.startsWith(route) && route !== '/') {
        link.classList.add('active');
      } else if (route === '/' && hash === '/') {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Find and mount view
    const ViewClass = this.routes[hash] || this.routes['/'];
    
    if (ViewClass) {
      this.app.mountView(ViewClass, { path: hash });
    } else {
      // 404
      this.mount404();
    }
  }

  mount404() {
    const container = document.getElementById('app');
    container.innerHTML = `
      <div class="view not-found">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <a href="#/" class="btn btn-primary">Go Home</a>
      </div>
    `;
  }

  navigate(path) {
    window.location.hash = path;
  }
}