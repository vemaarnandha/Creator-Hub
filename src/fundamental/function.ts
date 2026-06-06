let tombol:"gula" | "kopi"

// option parameter
// 
//case 1 : optional parameter
function sapa(nama: string, gelar?: string): string {
    if (gelar) {
        return `Halo ${gelar} ${nama}\n`;
    }
    return `Halo ${nama}\n`;  
}
console.log(sapa("Budi", "Dr.")); // Halo Dr. Budi
console.log(sapa("Budi"));        // Halo Budi

// case 2 : default parameter
function kali(a: number, b: number = 2): number {
    return a * b;
}
console.log(kali(5));    // 10
console.log(kali(5, 3)); // 15

// return type : void vs never
function logError(msg: string): void {
    console.error(msg);
}

function lemparError(msg: string): never {
    throw new Error(msg);
}

// callback & function type
type OperasiMatematika = (x: number, y: number) => number;

const tambah: OperasiMatematika = (a, b) => a + b;
const kurang: OperasiMatematika = (a, b) => a - b;

function kalkulasi(operasi: OperasiMatematika, a: number, b: number): number {
    return operasi(a, b);
}
console.log(kalkulasi(tambah, 5, 3)); // 8
console.log(kalkulasi(kurang, 5, 3)); // 2

// latihan function : fungsi pecari diskon bertingkat
type perhitunganDiskon = (diskon: number, totalBelanja: number) => number;

// Ubah nama agar tidak bentrok dengan parameter nanti
const hitungHargaAkhir: perhitunganDiskon = (diskon, totalBelanja) => {
    return (100 - diskon) / 100 * totalBelanja;
};

// Parameter: totalBelanja (bukan hargaAkhir), lalu member
function hitungDiskon(totalBelanja: number, member: boolean): number {
    if (totalBelanja >= 500_000 && member) {
        return hitungHargaAkhir(20, totalBelanja);
    } else if (totalBelanja >= 500_000 && !member) {
        return hitungHargaAkhir(10, totalBelanja);
    } else {
        return hitungHargaAkhir(5, totalBelanja);
    }
}

console.log(hitungDiskon(1_000_000, true));   // 800000
console.log(hitungDiskon(1_000_000, false));  // 900000
console.log(hitungDiskon(100_000, true));     // 95000 (diskon 5%)
// type return never >
type Shape = { kind: "circle"; radius: number } | { kind: "square"; side: number };
function area(s: Shape): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.radius ** 2;
    case "square": return s.side ** 2;
    default:
      // s di sini bertipe never, karena semua kemungkinan sudah habis.
      // Jika suatu saat kita tambah variant baru, TypeScript akan error di sini.
      const _exhaustiveCheck: never = s;
      return _exhaustiveCheck;
  }
}