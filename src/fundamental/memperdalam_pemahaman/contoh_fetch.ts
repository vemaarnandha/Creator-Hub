// ============================================================
// CONTOH FETCH LENGKAP (TypeScript)
// Analogi: Stella minta permen ke Vem lewat jendela~!
// ============================================================

// --- 1. FETCH PALING SEDERHANA ---
// Aku minta data ke server... terus tunggu jawabannya

async function ambilDataProduk() {
  // fetch("alamat") = teriak ke Vem dari jauh
  const response = await fetch("https://api.example.com/produk");

  // response.json() = buka amplopnya, baca isi suratnya
  const data = await response.json();

  console.log(data);
}

// --- 2. FETCH LENGKAP DENGAN ERROR HANDLING ---
// Kalau Vem lagi tidur... atau permen habis... aku harus siap nangis T_T

interface Produk {
  id: number;
  nama: string;
  harga: number;
}

async function ambilProdukAman(): Promise<Produk[] | null> {
  try {
    // Kirim surat permintaan
    const response = await fetch("https://api.example.com/produk");

    // Cek: apakah Vem jawab dengan senyum? (status 200 = OK)
    if (!response.ok) {
      // Kalau Vem marah atau lagi sibuk... (status 404, 500, dll)
      throw new Error(`Gagal ambil data! Status: ${response.status}`);
    }

    // Buka suratnya dan ubah jadi data yang bisa dibaca
    const produk: Produk[] = await response.json() as Produk[];

    return produk; // Yeay~! Dapat permen!

  } catch (error) {
    // Kalau internet putus... atau Vem nggak ada di rumah...
    console.error("Aduh... gagal T_T:", error);
    return null; // Pulang dengan tangan kosong...
  }
}

// --- 3. FETCH DENGAN KONFIGURASI (POST, kirim data) ---
// Kalau aku mau kasih permen ke Vem, bukan minta!

async function kirimProdukBaru(produk: Produk) {
  const response = await fetch("https://api.example.com/produk", {
    method: "POST",        // "POST" = kirim data, bukan ambil
    headers: {
      "Content-Type": "application/json"  // Kasih tahu: ini surat JSON
    },
    body: JSON.stringify(produk)  // Ubah object jadi string JSON
  });

  if (!response.ok) {
    throw new Error("Gagal kirim produk...");
  }

  return await response.json();
}

// --- 4. CARA PAKAI ---
async function main() {
  // Ambil data
  const produk = await ambilProdukAman();

  if (produk) {
    console.log("Dapat produk~!:");
    produk.forEach(p => console.log(`- ${p.nama}: Rp${p.harga}`));
  } else {
    console.log("Produknya nggak ada... sedih...");
  }

  // Kirim data
  const produkBaru = { id: 99, nama: "Permen Stella", harga: 5000 };
  await kirimProdukBaru(produkBaru);
}

main();