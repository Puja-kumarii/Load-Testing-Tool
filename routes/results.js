import { createProxyMiddleware } from 'http-proxy-middleware';
import { handleProxyMiddleware } from '../utils.js';
import { Router } from 'express';

const router = Router();

router.use(
  '/show',
  handleProxyMiddleware('http://localhost:5665/ui/?endpoint=/'),
  createProxyMiddleware({
    target: 'http://localhost:5665/ui/?endpoint=/',
    changeOrigin: true,
  })
);

router.use(
  '/events',
  handleProxyMiddleware(),
  createProxyMiddleware({
    target: 'http://localhost:5665/events',
    changeOrigin: true,
    ws: true,
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(500).send('Proxy Error');
    },
    pathRewrite: {
      '^/results': '', // Remove '/results' from the URL path
    },
  })
);

router.use(
  '/',
  handleProxyMiddleware('http://localhost:5665/ui/'),
  createProxyMiddleware({
    target: 'http://localhost:5665/ui/',
    changeOrigin: true,
    pathRewrite: {
      '^/results': '', // Remove '/results' from the URL path
    },
  })
);

export default router;
