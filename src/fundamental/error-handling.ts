// contoh error handling//
class ValidationError extends Error {
  constructor(pesan:string){
    super(pesan)
    this.name = "VakidationError"
  }
}

function validasiAkun(username: string, password: string): string {
  if (username.length < 5) {
    throw new ValidationError("Username harus minimal 5 karakter.");
  }
  if (password.length < 8) {
    throw new ValidationError("Password harus minimal 8 karakter.");
  }
  if (!/\d/.test(password)) {
    throw new ValidationError("Password harus mengandung minimal satu angka.");
  }
  // Jika lolos semua, fungsi selesai tanpa return (void)
  return `akun anda : ${username}\npassword : ${password} `
}

function daftarAkun(username: string, password: string): string {
  try {
    validasiAkun(username, password);
    return `Pendaftaran akun "${username}" berhasil!`;
  } catch (error) {
    if (error instanceof ValidationError) {
      return `Gagal mendaftar: ${error.message}`;
    }
    // Jika error tidak dikenal, lemparkan lagi atau tampilkan pesan umum
    return "Terjadi kesalahan tak terduga.";
  }
}

console.log(daftarAkun("aaass","ksdj"))

// 
// =====Latihan Kerja Baru: Validasi Registrasi (Form Sederhana)=====//
//
// Tulis fungsi validasiForm di sini


function validasiForm(username: string, password: string, email?: string): void {
  // Username: minimal 5 karakter, tanpa spasi
  if (username.length < 5) {
    throw new ValidationError("Username harus minimal 5 karakter.");
  }
  if (username.includes(" ")) {
    throw new ValidationError("Username tidak boleh mengandung spasi.");
  }

  // Password: minimal 8 karakter, ada huruf besar, ada angka
  if (password.length < 8) {
    throw new ValidationError("Password harus minimal 8 karakter.");
  }
  if (!/[A-Z]/.test(password)) {
    throw new ValidationError("Password harus mengandung minimal satu huruf besar.");
  }
  if (!/[0-9]/.test(password)) {
    throw new ValidationError("Password harus mengandung minimal satu angka.");
  }

  // Email: hanya divalidasi jika diberikan (opsional), harus ada '@'
  if (email !== undefined) {
    if (!email.includes("@")) {
      throw new ValidationError("Email tidak valid, harus mengandung '@'.");
    }
  }
}

// Tulis fungsi submitForm di sini

function submitForm(username: string, password: string, email?: string): string {
  try {
    validasiForm(username, password, email);
    return `Pendaftaran akun "${username}" berhasil!`;
  } catch (error) {
    if (error instanceof ValidationError) {
      return `Gagal mendaftar: ${error.message}`;
    }
    return "Terjadi kesalahan tak terduga.";
  }
}

// Uji coba (sesuai skenario di latihan)
console.log(submitForm("budi", "rahasia1A"));             // sukses (tanpa email)
console.log(submitForm("an", "rahasia1A"));               // error: username minimal 5
console.log(submitForm("budi", "rahasia"));               // error: password butuh angka & huruf besar
console.log(submitForm("budi", "rahasia1a"));             // error: password butuh huruf besar
console.log(submitForm("budi", "rahasia1A", "email"));    // error: email tanpa @
console.log(submitForm("budi", "rahasia1A", "a@b.c"));    // sukses dengan email valid