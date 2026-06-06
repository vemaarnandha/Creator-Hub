// Definisikan bentuk response: dua kemungkinan
type ResponseProduk = 
  | { jenis: "sukses"; data: { nama: string; harga: number } }
  | { jenis: "error"; pesan: string };

async function ambilProduk(id: number): Promise<ResponseProduk> {
  const response = await fetch(`/api/produk/${id}`);
  const json = await response.json() as Record<string, unknown>;
  
  // Di sini kita beri stiker (menentukan jenis response)
  if (json.error) {
    return { jenis: "error", pesan: json.error as string };
  }
  return { jenis: "sukses", data: json as { nama: string; harga: number } };
}

// Penggunaan
const hasil = await ambilProduk(1);

// TypeScript MEMAKSA kita mengecek stiker dulu
if (hasil.jenis === "sukses") {
  console.log("Nama: " + hasil.data.nama);   // AMAN, TypeScript tahu data ada
} else {
  console.log("Error: " + hasil.pesan);      // AMAN, TypeScript tahu pesan ada
}