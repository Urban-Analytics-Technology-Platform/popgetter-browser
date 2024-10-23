import { error } from "@sveltejs/kit";
import duckdb from "duckdb";

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  const metrics = url.searchParams.get("metrics") ?? "";
  console.log("Metrics request", metrics);

  const db = new duckdb.Database(":memory:"); // or a file name for a persistent DB
  console.time("fetch");
  try {
    const result = await new Promise((resolve, reject) => {
      db.all(`INSTALL httpfs; LOAD httpfs; ${metrics}`, (err, result) => {
        console.timeEnd("fetch");
        if (err) {
          reject(err);
        }
        resolve(result);
      });
    });
    console.log(result);
    // Added the below serialization for to fix serializing "bigint" error
    // https://github.com/GoogleChromeLabs/jsbi/issues/30#issuecomment-521460510
    return new Response(
      JSON.stringify(
        result,
        (key, value) => (typeof value === "bigint" ? value.toString() : value), // return everything else unchanged
      ),
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }));
  }
}
