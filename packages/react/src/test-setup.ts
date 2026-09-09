import { configure } from '@testing-library/react';

/*
 * How long an async query may keep retrying.
 *
 * SEPARATE from vitest's `testTimeout`, and that is the whole bug. `apps/web`
 * raised its `testTimeout` to 20s against exactly this flake and wrote the
 * signature down — "green when the suite runs alone, red inside `run-many`,
 * and a DIFFERENT test each time" — but `testTimeout` only bounds the test as a
 * whole. `findBy*` and `waitFor` are bounded by testing-library's own
 * `asyncUtilTimeout`, which is 1000ms and which nothing here had touched.
 *
 * So a contended `findByRole` gave up at one second and failed as "unable to
 * find role=…" — an assertion failure, not a timeout, which is why it reads as
 * a broken component rather than a slow machine and why raising `testTimeout`
 * never fixed it. `LinkField.spec` failed this way on every `run-many` and
 * passed alone every time.
 *
 * 5s is far below the 20s a genuine hang would sit under, so a control that
 * really never renders still fails — it just no longer fails because four
 * projects were compiling at once.
 */
configure({ asyncUtilTimeout: 5_000 });
