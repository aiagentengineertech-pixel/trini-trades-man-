// Type shims so TypeScript accepts CSS side-effect imports used by the template.
// Metro/Expo handle the actual CSS at bundle time.
declare module '*.css';
declare module '*.module.css';
