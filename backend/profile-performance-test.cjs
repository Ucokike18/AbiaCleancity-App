
const http = require("node:http");
const { performance } = require("node:perf_hooks");
const token = process.env.ABIA_TEST_TOKEN;

if (!token) {
    console.error("Token missing. No requests sent.");
    process.exit(1);
}

function request() {
    return new Promise((resolve) => {
        const start = performance.now();
        const req = http.get({
            hostname: "127.0.0.1",
            port: 5000,
            path: "/api/users/profile",
            headers: { Authorization: `Bearer ${token}` }
        }, (res) => {
            res.resume();
            res.on("end", () => resolve({
                status: res.statusCode,
                ms: performance.now() - start
            }));
        });

        req.setTimeout(15000, () => req.destroy(new Error("Timeout")));
        req.on("error", () => resolve({ error: true }));
    });
}

function percentile(values, p) {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted.length
        ? sorted[Math.ceil(p * sorted.length) - 1]
        : NaN;
}

async function run(concurrency) {
    const results = [];
    let next = 0;

    async function worker() {
        while (true) {
            const i = next++;
            if (i >= 20) return;
            results[i] = await request();
        }
    }

    const start = performance.now();
    await Promise.all(
        Array.from({ length: concurrency }, () => worker())
    );
    const elapsed = performance.now() - start;

    const statuses = {};
    for (const r of results) {
        const key = r.error ? "NETWORK_ERROR" : r.status;
        statuses[key] = (statuses[key] || 0) + 1;
    }

    const successful = results.filter(r => !r.error && r.status === 200);
    const times = successful.map(r => r.ms);

    console.log(`\n--- CONCURRENCY ${concurrency} ---`);
    console.log("Requests:", results.length);
    console.log("Duration (ms):", elapsed.toFixed(1));
    console.log("Throughput (req/sec):",
        (successful.length / (elapsed / 1000)).toFixed(1));
    console.log("Median (ms):",
        times.length ? percentile(times, 0.5).toFixed(1) : "N/A");
    console.log("P95 (ms):",
        times.length ? percentile(times, 0.95).toFixed(1) : "N/A");
    console.log("Statuses:", JSON.stringify(statuses));
}

(async () => {
    const check = await request();
    console.log("Authentication pre-check:",
        check.error ? "NETWORK_ERROR" : check.status);

    if (check.error || check.status !== 200) {
        console.log("Stopping. Resolve authentication first.");
        return;
    }

    await run(1);
    await run(5);
    await run(10);
})();
