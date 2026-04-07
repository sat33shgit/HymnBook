import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

function getRequiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeCorsRule(rule) {
  if (!isPlainObject(rule)) {
    throw new Error("Each CORS rule must be a JSON object.");
  }

  if ("allowed" in rule) {
    return rule;
  }

  if (!Array.isArray(rule.AllowedOrigins) || !Array.isArray(rule.AllowedMethods)) {
    throw new Error(
      "Dashboard-style CORS rules must include AllowedOrigins and AllowedMethods arrays."
    );
  }

  const normalizedRule = {
    allowed: {
      origins: rule.AllowedOrigins,
      methods: rule.AllowedMethods,
    },
  };

  if (Array.isArray(rule.AllowedHeaders) && rule.AllowedHeaders.length > 0) {
    normalizedRule.allowed.headers = rule.AllowedHeaders;
  }

  if (Array.isArray(rule.ExposeHeaders) && rule.ExposeHeaders.length > 0) {
    normalizedRule.exposeHeaders = rule.ExposeHeaders;
  }

  if (typeof rule.MaxAgeSeconds === "number") {
    normalizedRule.maxAgeSeconds = rule.MaxAgeSeconds;
  }

  if (typeof rule.ID === "string" && rule.ID.trim()) {
    normalizedRule.id = rule.ID.trim();
  }

  return normalizedRule;
}

function normalizeCorsPolicy(policy) {
  if (Array.isArray(policy)) {
    return { rules: policy.map(normalizeCorsRule) };
  }

  if (isPlainObject(policy) && Array.isArray(policy.rules)) {
    return { rules: policy.rules.map(normalizeCorsRule) };
  }

  throw new Error(
    "Unsupported R2 CORS policy format. Use either the dashboard JSON array format or an object with a rules array."
  );
}

async function main() {
  const accountId = getRequiredEnv("R2_ACCOUNT_ID");
  const bucketName = getRequiredEnv("R2_BUCKET_NAME");
  const apiToken = getRequiredEnv("CLOUDFLARE_API_TOKEN");
  const policyFile =
    process.env.R2_CORS_FILE?.trim() || "scripts/r2-cors.hymnbook.json";

  const absolutePolicyFile = resolve(policyFile);
  const rawPolicy = await readFile(absolutePolicyFile, "utf8");
  const policy = normalizeCorsPolicy(JSON.parse(rawPolicy));

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/cors`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(policy),
    }
  );

  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    throw new Error(
      `Failed to update R2 bucket CORS: ${JSON.stringify(result ?? { status: response.status })}`
    );
  }

  console.log(
    `Updated CORS for bucket ${bucketName} using ${absolutePolicyFile}.`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
