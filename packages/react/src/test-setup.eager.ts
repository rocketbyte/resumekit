/*
 * The main suite draws every template synchronously, as the static renderer and
 * the export bundle do. `*.lazy.spec.tsx` runs without this, as an application
 * does: see the `react-lazy` project in vite.config.mts.
 */
import './test-setup.js';
import './all-templates.js';
