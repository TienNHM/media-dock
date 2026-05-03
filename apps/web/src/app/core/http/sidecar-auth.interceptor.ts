import { HttpInterceptorFn } from '@angular/common/http';
import { getSidecarAuthToken } from '@app/core/config/api.config';

/** Adds X-MediaDock-Token when the API enforces Sidecar auth (Production or explicit Sidecar:AuthToken). */
export const sidecarAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const token = getSidecarAuthToken();
  if (!token) return next(req);
  return next(req.clone({ setHeaders: { 'X-MediaDock-Token': token } }));
};
