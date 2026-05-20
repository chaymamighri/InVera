import React from 'react';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.locationKey = `${window.location.pathname}${window.location.search}`;
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Application render error:', error, info);
  }

  componentDidUpdate() {
    const nextLocationKey = `${window.location.pathname}${window.location.search}`;

    if (this.state.error && nextLocationKey !== this.locationKey) {
      this.locationKey = nextLocationKey;
      this.setState({ error: null });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-lg border border-red-100 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">Une erreur est survenue</h1>
          <p className="mt-2 text-sm text-slate-600">
            La page a rencontre une erreur d'affichage. Rechargez la page pour continuer.
          </p>
          {import.meta.env.DEV && this.state.error?.message && (
            <pre className="mt-4 max-h-40 overflow-auto rounded-md bg-slate-100 p-3 text-left text-xs text-slate-700">
              {this.state.error.message}
            </pre>
          )}
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Recharger
          </button>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
