# Webpack: Port upload safety (Recharts / lodash)

The default **`assets/template-webpack.config.js`** does **not** include these changes. **Apply them whenever the plugin depends on [Recharts](https://recharts.org/)** — see [ui-and-styling.md](ui-and-styling.md) (**Charts**).

## When to apply

Add the Port-safe webpack tweaks if **any** of the following is true:

| Trigger | Example |
|---------|---------|
| **Plugin uses Recharts** | **Always** — proactive; Recharts pulls in lodash `_root.js` |
| **`port-plugins upload` rejects the bundle** | Error mentions `Function`, `new Function`, or unsafe eval |
| **Other chart lib pulls in lodash** | Some d3 wrappers |
| **Built HTML contains `Function("return this")`** | `rg 'Function\(' dist/index.html` (or `grep`) |

Do **not** add for minimal React widgets with **no** chart library and a successful upload.

## Steps

### 1. Copy the lodash shim (only if using `NormalModuleReplacementPlugin` below)

```bash
mkdir -p <widget>/webpack
cp .cursor/skills/create-port-plugin/assets/webpack/lodash-root-shim.js \
   <widget>/webpack/lodash-root-shim.js
```

(Use `.claude/skills/create-port-plugin/assets/...` in Claude Code.)

### 2. Patch `webpack.config.js`

At the top, add:

```javascript
const webpack = require("webpack");
```

In **`output`**, add:

```javascript
globalObject: "self",
```

In **`plugins`**, **before** `HtmlWebpackPlugin`, add:

```javascript
new webpack.NormalModuleReplacementPlugin(
  /[\\/]lodash[\\/]_root\.js$/,
  path.resolve(__dirname, "webpack/lodash-root-shim.js"),
),
new webpack.DefinePlugin({
  global: "globalThis",
}),
```

### 3. Rebuild and re-upload

```bash
npm run build
port-plugins upload --file dist/index.html ...
```

## Reference implementation

See [`entity-timeline/webpack.config.js`](../../../../entity-timeline/webpack.config.js) and [`entity-timeline/webpack/lodash-root-shim.js`](../../../../entity-timeline/webpack/lodash-root-shim.js) in this repo for a working example.

## What each piece does

| Change | Purpose |
|--------|---------|
| `output.globalObject: "self"` | Avoid webpack’s `__webpack_require__.g` polyfill (`new Function`) |
| `NormalModuleReplacementPlugin` + shim | Replace `lodash/_root.js` without `Function("return this")` |
| `DefinePlugin({ global: "globalThis" })` | Satisfy lodash’s `global` reference without a Node polyfill in the bundle |
