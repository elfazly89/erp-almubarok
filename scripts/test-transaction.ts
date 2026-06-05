import { db } from "../src/lib/db";
import { pesan_cabang } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

try {
  console.log("Testing synchronous transaction with Drizzle...");
  
  const result = db.transaction((tx) => {
    console.log("Inside transaction...");
    const [testRow] = tx
      .insert(pesan_cabang)
      .values({
        kode_request: "TEST-TX-12345",
        id_cabang_peminta: 2,
        id_cabang_sumber: 3,
        id_user_peminta: 4,
        tanggal_request: "2026-06-04",
        status: "Pending",
      })
      .returning()
      .all();
      
    console.log("Inserted row ID:", testRow.id_request);
    
    // Clean up
    tx.delete(pesan_cabang).where(eq(pesan_cabang.id_request, testRow.id_request)).run();
    console.log("Deleted test row.");
    
    return { ok: true, id: testRow.id_request };
  });
  
  console.log("Transaction Result:", result);
} catch (e) {
  console.error("Transaction Error:", e);
}
