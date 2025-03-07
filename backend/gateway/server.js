// Update your proxy middleware
app.use(
  "/api/auth",
  createProxyMiddleware({
    target: "http://localhost:5007",
    changeOrigin: true,
  }),
);

app.use(
  "/api/transcription",
  createProxyMiddleware({
    target: "http://localhost:5008",
    changeOrigin: true,
  }),
);

app.use(
  "/api/client",
  createProxyMiddleware({
    target: "http://localhost:5009",
    changeOrigin: true,
  }),
);

app.use(
  "/api/chatbot",
  createProxyMiddleware({
    target: "http://localhost:5010",
    changeOrigin: true,
  }),
);
