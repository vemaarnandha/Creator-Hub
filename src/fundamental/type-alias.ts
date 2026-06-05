//tanpa type alias 
// function cekPesanMinuman(pesan: "kecil" | "sedang" | "besar") {
//   console.log(`Pesan minuman: ${pesan}`);
// }
// cekPesanMinuman("sedang"); // Output: Pesan minuman: sedang

//tanpa alias
function pilihMinuman(pilihan: "air" | "teh"): void {
  console.log("Anda memilih minuman: " + pilihan);
}

pilihMinuman("air"); // Anda memilih minuman: air
console.info()

