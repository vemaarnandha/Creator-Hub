//fetch data : contoh
// interface Product {
//   id: number;
//   name: string;
//   price: number;
// }

// type ApiResponse<T> = 
//   | { status: "success"; data: T }
//   | { status: "error"; message: string };

// async function getProduct(id: number): Promise<ApiResponse<Product>> {
//   const response = await fetch(`/api/product/${id}`);
//   const json = await response.json();
//   // Kita validasi dan bentuk sesuai ApiResponse (disederhanakan di sini)
//   return json;
// }

// Penggunaan
// const result = await getProduct(1);
// if (result.status === "success") {
//   console.log(`Produk: ${result.data.name}`); // Aman, tahu properti ada
// } else {
//   console.error(`Error: ${result.message}`);
// }

//======poin penting saat berkerja dengan api!=====\\

// A. memodelkan response dengan generic type.
type ApiResponse<T> = 
  | { status: "success"; data: T; }
  | { status: "error"; message: string; code?: number; };


  // Fungsi untuk mensimulasikan proses memuat data dari server (membutuhkan waktu 2 detik)
function ambilDataServer(): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("Data berhasil diambil!");
    }, 2000);
  });
}

// Menggunakan async pada fungsi utama
async function tampilkanData() {
  console.log("Mulai mengambil data...");

  // Menunggu hingga proses ambilDataServer selesai (ditandai dengan await)
  const hasil = await ambilDataServer(); 
  
  console.log(hasil); // Baris ini hanya akan dieksekusi setelah 2 detik
  console.log("Proses selesai!");
}

tampilkanData();


// {}
// Definisikan bentuk response: dua kemungkinan
type ResponseProduk = 
  | { jenis: "sukses"; data: { nama: string; harga: number } }
  | { jenis: "error"; pesan: string };

async function ambilProduk(id: number): Promise<ResponseProduk> {
  const response = await fetch(`/api/produk/${id}`);
  const json = await response.json();
  
  // Di sini kita beri stiker (menentukan jenis response)
  if (json.error) {
    return { jenis: "error", pesan: json.error };
  }
  return { jenis: "sukses", data: json };
}

// Penggunaan
const hasil = await ambilProduk(1);

// TypeScript MEMAKSA kita mengecek stiker dulu
if (hasil.jenis === "sukses") {
  console.log("Nama: " + hasil.data.nama);   // AMAN, TypeScript tahu data ada
} else {
  console.log("Error: " + hasil.pesan);      // AMAN, TypeScript tahu pesan ada
}