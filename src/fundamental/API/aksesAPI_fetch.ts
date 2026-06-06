    // 1. Interface Produk
    interface Produk {
    id: number;
    nama: string;
    harga: number;
    stok: number;
    }

    // 2. Type ApiResponse generik
    type ApiResponse<T> = 
    | { status: "sukses"; data: T }
    | { status: "gagal"; pesan: string };

    // 3. Simulasi fetch dari server (JANGAN diubah, sudah jadi)
    function fetchDariServer(): Promise<ApiResponse<Produk[]>> {
    return new Promise((resolve) => {
        setTimeout(() => {
        // Data dummy sukses
        const produkDummy: Produk[] = [
            { id: 1, nama: "Buku TypeScript", harga: 100000, stok: 5 },
            { id: 2, nama: "Mouse Gaming", harga: 250000, stok: 12 },
            { id: 3, nama: "Headphone Bluetooth", harga: 350000, stok: 3 }
        ];
        // 80% sukses, 20% gagal
        const sukses = Math.random() < 0.8;
        if (sukses) {
            resolve({ status: "sukses", data: produkDummy });
        } else {
            resolve({ status: "gagal", pesan: "Server sedang sibuk, coba lagi nanti." });
        }
        }, 1000); // tunda 1 detik simulasi jaringan
    });
    }

    // 4. Fungsi tampilkanKatalog (TUGAS KAMU)
    function tampilkanKatalog(response: ApiResponse<Produk[]>): string {
    // Tulis logika di sini
    // Jika response.status === "sukses", loop data dan buat string
    // Jika gagal, kembalikan pesan error
    if (response.status === "sukses") {
        let hasil = "Katalog Produk:\n";
        for (const produk of response.data) {
        hasil += `- ${produk.nama}: Rp${produk.harga} (Stok: ${produk.stok})\n`;
        }
        return hasil;
    } else {
        return `Maaf, terjadi error: ${response.pesan}`;
    }
    }

    // 5. Fungsi main untuk memanggil (TUGAS KAMU)
    async function main() {
    // Panggil fetchDariServer() dengan await
    // Tampilkan hasil lewat console.log(tampilkanKatalog(...))
    const response = await fetchDariServer();
    console.log(tampilkanKatalog(response));
    }

    // Jalankan main
    main();