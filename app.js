/* SD Negeri 8 Arawai — portal sekolah
   Vanilla re-implementation of the Claude Design prototype.
   Single-page client-side app: state -> render -> DOM, no framework. */
(function () {
  'use strict';

  // ---- config (mirrors the prototype's editor props / defaults) ----
  var CONFIG = {
    defaultRoute: 'beranda',
    showAnnouncementBar: false,
    showLoginHint: true,
    compactCards: false
  };

  // ---- helpers ----
  function ini(n) {
    return n.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  function fmtDate(iso) { var d = new Date(iso); return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear(); }
  function typeLabel(t) { return t === 'news' ? 'Berita' : t === 'psb' ? 'PSB' : 'Pengumuman'; }
  function gradeCls(n) { return n >= 90 ? 'a' : 'b'; }
  function pred(n) { return n >= 90 ? 'Sangat Baik' : n >= 80 ? 'Baik' : 'Cukup'; }

  // ---- data ----
  var misi = [
    'Menumbuhkan budi pekerti luhur dan karakter mulia.',
    'Mengembangkan kreativitas dan jiwa wirausaha sejak dini.',
    'Membiasakan pembelajaran aktif yang menyenangkan.'
  ];
  var kurikulum = {
    1: [['Bahasa Indonesia', 'Mengenal huruf, membaca suku kata, dan menulis kata sederhana.'], ['Matematika', 'Bilangan 1–100, penjumlahan dan pengurangan dasar.'], ['Pendidikan Pancasila', 'Mengenal aturan, simbol Pancasila, dan hidup rukun.'], ['Seni & Prakarya', 'Menggambar, mewarnai, dan membuat karya dari bahan sederhana.']],
    2: [['Bahasa Indonesia', 'Membaca lancar, memahami cerita pendek, dan menulis kalimat.'], ['Matematika', 'Nilai tempat ratusan, perkalian, dan pengukuran panjang.'], ['Pendidikan Pancasila', 'Sikap gotong royong dan tanggung jawab di rumah dan sekolah.'], ['IPAS', 'Mengenal makhluk hidup dan lingkungan sekitar.']],
    3: [['Bahasa Indonesia', 'Menyusun paragraf, memahami teks, dan bercerita di depan kelas.'], ['Matematika', 'Perkalian, pembagian, dan pengenalan pecahan sederhana.'], ['IPAS', 'Cuaca, energi, dan pertumbuhan tumbuhan.'], ['Wirausaha Cilik', 'Membuat dan menjual karya kerajinan sederhana.']],
    4: [['Bahasa Indonesia', 'Membaca teks nonfiksi dan menulis laporan sederhana.'], ['Matematika', 'KPK/FPB, pecahan, bangun datar, dan keliling.'], ['IPAS', 'Ekosistem, gaya, dan sumber daya alam.'], ['Seni Budaya', 'Seni rupa daerah dan pertunjukan sederhana.']],
    5: [['Bahasa Indonesia', 'Teks eksposisi, wawancara, dan menulis kreatif.'], ['Matematika', 'Pecahan campuran, volume, dan penyajian data.'], ['IPAS', 'Sistem tubuh manusia, siklus air, dan magnet.'], ['Wirausaha', 'Menghitung modal, harga jual, dan pemasaran karya.']],
    6: [['Bahasa Indonesia', 'Teks argumentasi, pidato, dan literasi digital.'], ['Matematika', 'Bilangan bulat, lingkaran, dan statistika dasar.'], ['IPAS', 'Listrik, tata surya, dan pelestarian lingkungan.'], ['Proyek Kewirausahaan', 'Merancang produk, kemasan, dan presentasi bisnis.']]
  };
  var days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  var pool = {
    1: ['Bahasa Indonesia', 'Matematika', 'Pancasila', 'Seni & Prakarya', 'Agama', 'PJOK'],
    2: ['Bahasa Indonesia', 'Matematika', 'Pancasila', 'IPAS', 'Agama', 'PJOK'],
    3: ['Bahasa Indonesia', 'Matematika', 'IPAS', 'Wirausaha Cilik', 'Agama', 'PJOK'],
    4: ['Bahasa Indonesia', 'Matematika', 'IPAS', 'Seni Budaya', 'Agama', 'PJOK'],
    5: ['Bahasa Indonesia', 'Matematika', 'IPAS', 'Wirausaha', 'Agama', 'PJOK'],
    6: ['Bahasa Indonesia', 'Matematika', 'IPAS', 'Proyek Kewirausahaan', 'Agama', 'PJOK']
  };
  var jadwal = {};
  for (var k = 1; k <= 6; k++) {
    (function (kk) {
      var p = pool[kk];
      jadwal[kk] = days.map(function (h, i) { return { hari: h, pelajaran: [p[i % p.length], p[(i + 1) % p.length], p[(i + 2) % p.length]] }; });
    })(k);
  }
  var teachers = [
    ['Ibu Siti Marlina, S.Pd.', 'Wali Kelas 1A'], ['Bapak Andi Prasetyo, S.Pd.', 'Wali Kelas 2A'],
    ['Ibu Retno Wulandari, S.Pd.', 'Wali Kelas 3A'], ['Bapak Dedi Kurniawan, S.Pd.', 'Wali Kelas 4A'],
    ['Ibu Fitri Handayani, S.Pd.', 'Wali Kelas 5A'], ['Bapak Joko Susilo, S.Pd.', 'Wali Kelas 6A'],
    ['Ibu Nurul Aini, S.Pd.', 'Guru Matematika'], ['Bapak Rahmat Hidayat, S.Pd.', 'Guru PJOK'],
    ['Ibu Dewi Lestari, S.Ag.', 'Guru Agama']
  ].map(function (t) { return { name: t[0], role: t[1], ini: ini(t[0]) }; });
  var namesByClass = [
    ['Kirana Putri', 'Rafi Ananda', 'Alika Zahra', 'Bima Saputra', 'Nayla Aprilia', 'Dimas Pratama'],
    ['Rendi Maulana', 'Salsabila Nur', 'Fauzan Akbar', 'Gita Lestari', 'Yoga Perdana', 'Nadira Ayu'],
    ['Nadia Safira', 'Damar Wicaksono', 'Kayla Ramadhani', 'Arka Nugraha', 'Sofia Melati', 'Rizky Hakim'],
    ['Salsa Aprilia', 'Farel Adiputra', 'Zaskia Amanda', 'Hafiz Ramadhan', 'Lintang Sari', 'Bagus Priyono'],
    ['Bagas Pramono', 'Intan Permata', 'Ridho Firmansyah', 'Aisyah Kirania', 'Devan Saputra', 'Maura Anindya'],
    ['Aulia Rahma', 'Fajar Sidiq', 'Nabila Zahira', 'Rangga Wijaya', 'Citra Kirana', 'Ilham Maulana']
  ];
  var students = {};
  for (var sc = 1; sc <= 6; sc++) students[sc] = namesByClass[sc - 1].map(function (n, i) { return { no: i + 1, name: n, ini: ini(n) }; });
  var works = [
    ['Celengan Kertas Daur Ulang', 3, 'Kerajinan', 'Nadia Safira', 'Celengan lucu dibuat dari gulungan kertas bekas dan cat air. Proyek ini mengajarkan hemat menabung sekaligus mendaur ulang sampah kertas menjadi barang bermanfaat.'],
    ['Keripik Bayam Renyah', 5, 'Kuliner', 'Bagas Pramono', 'Camilan sehat dari daun bayam segar yang digoreng tepung. Dikemas menarik dan dijual saat Pekan Karya Wirausaha dengan modal dan harga jual yang dihitung sendiri.'],
    ['Lukisan Batik Ecoprint', 4, 'Seni', 'Salsa Aprilia', 'Kain katun dihias motif daun asli dengan teknik ecoprint alami. Menggabungkan seni dan pengenalan tumbuhan sekitar sekolah.'],
    ['Gantungan Kunci Flanel', 2, 'Kerajinan', 'Rendi Maulana', 'Gantungan kunci berbentuk buah dari kain flanel warna-warni, dijahit tangan dengan rapi.'],
    ['Es Buah Segar Kemasan', 6, 'Kuliner', 'Aulia Rahma', 'Es buah segar dalam kemasan cup praktis. Proyek kewirausahaan lengkap dengan branding dan perhitungan laba.'],
    ['Komik Digital Pahlawan', 6, 'Digital', 'Fajar Sidiq', 'Komik pendek bertema pahlawan nasional yang digambar secara digital, mengajak teman-teman mencintai sejarah.'],
    ['Tempat Pensil Stik Es', 1, 'Kerajinan', 'Kirana Putri', 'Tempat pensil warna-warni dari stik es krim yang direkatkan dan dihias, hasil karya pertama Kelas 1.'],
    ['Puisi Bergambar Alam', 3, 'Seni', 'Damar Wicaksono', 'Kumpulan puisi tentang alam yang dipadukan ilustrasi tangan pada buku kecil buatan sendiri.'],
    ['Sabun Aroma Terapi Mini', 5, 'Kerajinan', 'Intan Permata', 'Sabun mini beraroma bunga dari bahan aman, dicetak berbagai bentuk dan dikemas sebagai suvenir.']
  ].map(function (w, i) { return { id: i, title: w[0], kelas: w[1], jenis: w[2], student: w[3], description: w[4], ini: ini(w[3]) }; });

  // ---- perpustakaan digital (digital library) ----
  // kategori list drives the filter + cover colour theme
  var pustakaKategoriList = ['Dongeng & Cerita', 'Pengetahuan', 'Pelajaran', 'Wirausaha', 'Komik'];
  var pustaka = [
    {
      title: 'Kancil dan Buaya', author: 'Cerita Rakyat Nusantara', kategori: 'Dongeng & Cerita', level: 'Umum', tahun: 2024, rating: 4.9,
      sinopsis: 'Kisah klasik si Kancil yang cerdik menyeberangi sungai dengan mengelabui kawanan buaya. Sebuah dongeng jenaka tentang akal budi dan keberanian.',
      isi: [
        'Pada suatu pagi yang cerah, Kancil merasa sangat lapar. Ia teringat pada kebun mentimun di seberang sungai yang buahnya segar dan manis. Namun sungai itu lebar dan dalam, serta dihuni banyak buaya lapar.',
        'Kancil duduk di tepi sungai sambil berpikir keras. Tiba-tiba ia mendapat akal. "Hai para buaya!" seru Kancil. "Raja hutan mengadakan pesta besar. Semua buaya akan mendapat daging segar. Aku diminta menghitung berapa jumlah kalian!"',
        'Mendengar kata pesta dan daging, para buaya bergegas berbaris rapi dari tepi ke tepi sungai. Kancil pun melompat dari punggung buaya satu ke buaya lainnya sambil berpura-pura menghitung, "Satu, dua, tiga…"',
        'Sesampainya di seberang, Kancil tertawa riang. "Terima kasih, buaya! Sebenarnya tidak ada pesta. Aku hanya ingin menyeberang!" Para buaya kesal karena tertipu, tetapi Kancil sudah asyik menikmati mentimun. Pesan cerita ini: gunakan akal dengan bijak, dan jangan mudah tergiur tanpa berpikir.'
      ]
    },
    {
      title: 'Legenda Danau Toba', author: 'Cerita Rakyat Sumatra', kategori: 'Dongeng & Cerita', level: 'Umum', tahun: 2023, rating: 4.7,
      sinopsis: 'Asal mula Danau Toba dan Pulau Samosir yang lahir dari sebuah janji yang dilanggar. Dongeng tentang menepati janji dan menghargai orang tua.',
      isi: [
        'Dahulu kala hiduplah seorang petani bernama Toba. Suatu hari ia memancing dan mendapat ikan emas yang sangat indah. Ajaibnya, ikan itu berubah menjadi seorang putri cantik.',
        'Putri bersedia menjadi istri Toba dengan satu syarat: Toba tidak boleh menceritakan asal-usulnya sebagai ikan kepada siapa pun. Toba berjanji, lalu mereka menikah dan dikaruniai seorang putra bernama Samosir.',
        'Suatu hari Samosir yang lapar menghabiskan bekal ayahnya. Dalam marah, Toba lupa akan janjinya dan berteriak, "Dasar anak keturunan ikan!" Seketika langit gelap, hujan turun deras tiada henti.',
        'Air memenuhi lembah dan membentuk danau luas yang kini disebut Danau Toba. Tanah tempat Samosir berdiri menjadi pulau di tengahnya, Pulau Samosir. Legenda ini mengajarkan kita untuk selalu menepati janji dan menjaga ucapan.'
      ]
    },
    {
      title: 'Petualangan di Kebun Sekolah', author: 'Tim Literasi SDN 8 Arawai', kategori: 'Dongeng & Cerita', level: 'Kelas 3', tahun: 2025, rating: 4.8,
      sinopsis: 'Nadia dan teman-temannya menemukan keajaiban di kebun sekolah saat merawat tanaman sawi. Cerita tentang kerja sama dan cinta lingkungan.',
      isi: [
        'Setiap pagi sebelum bel berbunyi, Nadia dan kelompoknya menyiram tanaman sawi di kebun sekolah. Mereka menanamnya sejak awal semester sebagai bagian dari pelajaran IPAS.',
        'Suatu hari Nadia melihat daun sawinya berlubang. "Pasti ada ulat!" seru Damar. Bukannya membasmi dengan sembarangan, Bu Guru mengajak mereka mengamati serangga itu dan belajar tentang rantai makanan.',
        'Mereka membuat orang-orangan sawah kecil dan menanam bunga di sekeliling kebun untuk mengundang kupu-kupu. Perlahan kebun menjadi sehat dan hijau kembali.',
        'Saat panen tiba, kelompok Nadia memanen sawi paling segar. Sebagian mereka jual di koperasi, sebagian disumbangkan ke dapur sekolah. Nadia belajar bahwa kesabaran dan kerja sama membuahkan hasil yang manis.'
      ]
    },
    {
      title: 'Mengenal Tata Surya', author: 'Rubrik Sains Anak', kategori: 'Pengetahuan', level: 'Kelas 6', tahun: 2024, rating: 4.6,
      sinopsis: 'Jelajahi Matahari, delapan planet, dan benda langit lain dalam sistem tata surya kita dengan bahasa yang mudah dipahami.',
      isi: [
        'Tata surya adalah keluarga besar Matahari. Matahari berada di pusat, dan delapan planet mengelilinginya dalam lintasan yang disebut orbit. Matahari adalah bintang, yaitu bola gas raksasa yang memancarkan cahaya dan panas.',
        'Empat planet terdekat — Merkurius, Venus, Bumi, dan Mars — disebut planet kebumian karena permukaannya padat berbatu. Bumi adalah satu-satunya planet yang diketahui memiliki kehidupan karena memiliki air dan udara.',
        'Empat planet terjauh — Jupiter, Saturnus, Uranus, dan Neptunus — disebut planet raksasa gas. Jupiter adalah planet terbesar, sedangkan Saturnus terkenal dengan cincinnya yang indah.',
        'Selain planet, tata surya juga berisi bulan, asteroid, dan komet. Mempelajari tata surya membantu kita memahami betapa luas dan menakjubkannya alam semesta ciptaan Tuhan.'
      ]
    },
    {
      title: 'Tubuh Manusia yang Menakjubkan', author: 'Rubrik Sains Anak', kategori: 'Pengetahuan', level: 'Kelas 5', tahun: 2024, rating: 4.5,
      sinopsis: 'Bagaimana jantung memompa darah, paru-paru bernapas, dan otak berpikir? Kenali sistem tubuh manusia dengan cara yang seru.',
      isi: [
        'Tubuh kita bekerja seperti mesin yang sangat canggih. Setiap bagian memiliki tugas masing-masing dan bekerja sama tanpa henti, bahkan saat kita tidur.',
        'Jantung adalah pompa sebesar kepalan tangan yang mengalirkan darah ke seluruh tubuh. Dalam sehari, jantung berdetak sekitar seratus ribu kali untuk mengantar oksigen dan sari makanan.',
        'Paru-paru membantu kita bernapas. Saat menarik napas, paru-paru mengambil oksigen dari udara; saat mengembuskan, ia mengeluarkan karbon dioksida yang sudah tidak diperlukan.',
        'Otak adalah pusat kendali tubuh. Ia mengatur gerakan, ingatan, dan perasaan. Untuk menjaga tubuh tetap sehat, kita perlu makan bergizi, cukup istirahat, dan rajin berolahraga.'
      ]
    },
    {
      title: 'Rahasia Tumbuhan Hijau', author: 'Rubrik Sains Anak', kategori: 'Pengetahuan', level: 'Kelas 4', tahun: 2023, rating: 4.4,
      sinopsis: 'Mengapa daun berwarna hijau dan bagaimana tumbuhan membuat makanannya sendiri? Temukan keajaiban fotosintesis.',
      isi: [
        'Tumbuhan adalah makhluk hidup yang istimewa karena dapat membuat makanannya sendiri. Proses ajaib ini disebut fotosintesis, yang berlangsung di daun.',
        'Daun berwarna hijau karena mengandung zat bernama klorofil. Klorofil menangkap cahaya Matahari, lalu bersama air dari akar dan udara, tumbuhan mengolahnya menjadi makanan berupa gula.',
        'Selain membuat makanan, fotosintesis juga menghasilkan oksigen yang kita hirup. Itulah mengapa menanam pohon sangat penting untuk menjaga udara tetap bersih dan segar.',
        'Rawatlah tumbuhan di sekitarmu dengan menyiram dan menjaganya. Dengan begitu, kita ikut menjaga bumi tetap hijau dan sehat untuk semua makhluk hidup.'
      ]
    },
    {
      title: 'Jago Perkalian', author: 'Seri Pintar Matematika', kategori: 'Pelajaran', level: 'Kelas 3', tahun: 2025, rating: 4.3,
      sinopsis: 'Belajar perkalian dengan cara menyenangkan, mulai dari konsep dasar hingga trik menghafal tabel perkalian.',
      isi: [
        'Perkalian adalah cara cepat untuk menjumlahkan angka yang sama berulang kali. Contohnya, 3 x 4 berarti menjumlahkan angka 3 sebanyak empat kali: 3 + 3 + 3 + 3 = 12.',
        'Kita bisa membayangkan perkalian sebagai kelompok benda. Jika ada 3 keranjang, dan tiap keranjang berisi 4 apel, maka jumlah seluruh apel adalah 3 x 4 = 12 apel.',
        'Trik mudah menghafal perkalian 9: hasilnya selalu berjumlah 9. Misalnya 9 x 2 = 18 (1+8=9), 9 x 3 = 27 (2+7=9). Menarik, bukan?',
        'Berlatihlah setiap hari dengan permainan kartu atau kuis bersama teman. Semakin sering berlatih, kamu akan semakin jago dan cepat dalam berhitung.'
      ]
    },
    {
      title: 'Pandai Menulis Cerita', author: 'Seri Cinta Bahasa', kategori: 'Pelajaran', level: 'Kelas 4', tahun: 2024, rating: 4.5,
      sinopsis: 'Panduan langkah demi langkah menyusun cerita yang menarik: menentukan tokoh, latar, dan alur yang seru.',
      isi: [
        'Setiap cerita yang bagus memiliki tiga bagian penting: tokoh (siapa), latar (di mana dan kapan), dan alur (apa yang terjadi). Ketiganya ibarat bahan utama sebuah masakan lezat.',
        'Mulailah dengan menentukan tokoh utama. Berikan ia nama, sifat, dan keinginan. Misalnya, seorang anak bernama Rio yang bercita-cita menjadi pemain bola.',
        'Selanjutnya, buatlah masalah atau tantangan bagi tokohmu. Cerita menjadi seru ketika tokoh berjuang menghadapi rintangan sebelum akhirnya mencapai tujuannya.',
        'Tutup cerita dengan akhir yang memuaskan atau pesan yang baik. Setelah selesai, bacalah kembali tulisanmu dan perbaiki kata yang kurang tepat. Selamat, kamu telah menjadi penulis cilik!'
      ]
    },
    {
      title: 'Wirausaha Cilik: Ide Pertamaku', author: 'Klub Wirausaha Sekolah', kategori: 'Wirausaha', level: 'Kelas 5', tahun: 2025, rating: 4.8,
      sinopsis: 'Buku panduan memulai usaha kecil dari hobi: menemukan ide, menghitung modal, hingga menjual produk pertama.',
      isi: [
        'Menjadi wirausaha berarti berani menciptakan sesuatu yang bermanfaat dan menjualnya. Ide usaha bisa datang dari hobi atau hal yang kamu sukai, misalnya menggambar, memasak, atau membuat kerajinan.',
        'Setelah punya ide, hitunglah modal. Modal adalah biaya untuk membeli bahan. Contohnya, untuk membuat gantungan kunci flanel, kamu perlu kain flanel, benang, dan gantungan. Catat semua harganya.',
        'Tentukan harga jual yang wajar. Harga jual harus lebih besar dari modal agar kamu mendapat keuntungan. Selisih antara harga jual dan modal itulah yang disebut laba.',
        'Terakhir, promosikan produkmu dengan sopan dan percaya diri kepada teman dan guru. Setiap penjualan adalah pengalaman berharga. Jangan takut gagal — dari situlah wirausaha sukses belajar!'
      ]
    },
    {
      title: 'Hemat Menabung Sejak Dini', author: 'Klub Wirausaha Sekolah', kategori: 'Wirausaha', level: 'Kelas 2', tahun: 2023, rating: 4.2,
      sinopsis: 'Kebiasaan baik menabung dan membedakan kebutuhan dengan keinginan, dijelaskan sederhana untuk murid kelas rendah.',
      isi: [
        'Menabung berarti menyisihkan sebagian uang untuk disimpan, bukan langsung dibelanjakan. Uang yang ditabung bisa digunakan untuk hal penting di kemudian hari.',
        'Sebelum membeli sesuatu, tanyakan pada dirimu: apakah ini kebutuhan atau keinginan? Kebutuhan adalah hal yang benar-benar diperlukan, seperti buku tulis. Keinginan adalah hal yang sekadar ingin dimiliki.',
        'Kamu bisa mulai menabung di celengan atau tabungan sekolah. Sedikit demi sedikit, lama-lama menjadi bukit. Tabungan kecil setiap hari akan terkumpul menjadi banyak.',
        'Dengan menabung, kamu belajar bersabar dan menghargai uang. Kebiasaan baik ini akan sangat berguna hingga kamu dewasa nanti.'
      ]
    },
    {
      title: 'Si Pemberani', author: 'Komik Karya Murid', kategori: 'Komik', level: 'Umum', tahun: 2025, rating: 4.9,
      sinopsis: 'Komik pendek tentang Bima, murid pemalu yang menemukan keberaniannya saat menolong teman. Digambar oleh murid Kelas 6.',
      isi: [
        'Bab 1 — Bima adalah anak yang pemalu. Ia selalu duduk di pojok kelas dan jarang berbicara. Teman-teman menyebutnya "si pendiam". Namun di dalam hati, Bima menyimpan keinginan besar untuk menjadi berani.',
        'Bab 2 — Suatu hari saat istirahat, Bima melihat seorang adik kelas terjatuh dan menangis karena diganggu. Tak ada yang berani menolong. Jantung Bima berdebar kencang.',
        'Bab 3 — Dengan mengumpulkan seluruh keberaniannya, Bima maju. "Hentikan! Kita harus saling menjaga, bukan mengganggu," katanya dengan suara bergetar namun tegas. Semua terdiam.',
        'Bab 4 — Sejak hari itu, teman-teman melihat Bima dengan pandangan baru. Bima sadar bahwa keberanian bukan berarti tidak takut, melainkan tetap melakukan hal benar meski hati merasa takut. Tamat.'
      ]
    },
    {
      title: 'Pahlawan dari Tanah Papua', author: 'Seri Pahlawan Nusantara', kategori: 'Pengetahuan', level: 'Umum', tahun: 2024, rating: 4.6,
      sinopsis: 'Mengenal tokoh dan semangat perjuangan dari tanah Papua yang menginspirasi persatuan dan cinta tanah air.',
      isi: [
        'Indonesia adalah negeri yang luas, membentang dari Sabang sampai Merauke. Tanah Papua di ujung timur menyimpan banyak kisah perjuangan dan tokoh yang menginspirasi.',
        'Frans Kaisiepo adalah salah satu pahlawan nasional dari Papua. Ia berjuang agar Papua menjadi bagian dari Negara Kesatuan Republik Indonesia. Namanya kini diabadikan sebagai nama bandara di Biak.',
        'Semangat para pahlawan mengajarkan kita untuk mencintai tanah air, menghargai perbedaan, dan menjaga persatuan. Meski berbeda suku dan bahasa, kita semua adalah satu bangsa Indonesia.',
        'Sebagai murid, cara kita menjadi pahlawan masa kini adalah dengan rajin belajar, menghormati sesama, dan menjaga lingkungan. Dari sekolah kecil di Arawai, kita bisa berbuat besar untuk negeri.'
      ]
    }
  ].map(function (b, i) {
    return {
      id: i, title: b.title, author: b.author, kategori: b.kategori, level: b.level,
      tahun: b.tahun, rating: b.rating, sinopsis: b.sinopsis, isi: b.isi, halaman: b.isi.length
    };
  });

  var articles = [
    ['Panen Raya Kebun Sekolah Kelas 4', 'news', '2025-12-02', 'Murid Kelas 4 memanen sayuran dari kebun sekolah hasil program berkebun satu semester.', 'Program berkebun Kelas 4 memasuki masa panen. Sepanjang semester, murid merawat bibit sawi, kangkung, dan tomat di kebun mini belakang sekolah.', ['Kegiatan panen berlangsung meriah. Setiap kelompok memanen dan menimbang hasilnya, lalu belajar menghitung berapa banyak yang bisa dijual di koperasi sekolah.', 'Guru pendamping menekankan bahwa proyek ini bukan sekadar berkebun, tetapi melatih kesabaran, kerja sama, dan pengenalan siklus tumbuhan yang dipelajari di IPAS.', 'Sebagian hasil panen disumbangkan ke dapur sekolah untuk program makan sehat bersama.']],
    ['Tim Robotik Raih Juara 2 Tingkat Kota', 'news', '2025-11-24', 'Tim robotik SDN 8 Arawai membawa pulang medali perak pada lomba tingkat kota.', 'Tim robotik yang beranggotakan murid Kelas 5 dan 6 berhasil meraih Juara 2 pada Kompetisi Robotik Pelajar tingkat kota akhir pekan lalu.', ['Setelah berlatih rutin selama dua bulan, tim merancang robot pemilah sampah sederhana yang mendapat apresiasi juri karena idenya ramah lingkungan.', 'Kepala sekolah mengucapkan selamat dan berharap prestasi ini memotivasi murid lain untuk gemar berinovasi.']],
    ['Pentas Seni Akhir Semester Meriah', 'news', '2025-11-15', 'Ratusan wali murid memadati aula menyaksikan pentas seni akhir semester.', 'Aula sekolah dipenuhi wali murid yang antusias menyaksikan penampilan tari, paduan suara, dan drama dari perwakilan tiap kelas.', ['Acara ditutup dengan pameran hasil karya wirausaha murid yang bisa dibeli langsung oleh pengunjung.', 'Dana yang terkumpul digunakan untuk kegiatan belajar dan perlengkapan seni tahun berikutnya.']],
    ['Libur Semester Ganjil 20–31 Desember', 'announcement', '2025-12-10', 'Kegiatan belajar diliburkan mulai 20 hingga 31 Desember 2025.', 'Diberitahukan kepada seluruh wali murid bahwa libur semester ganjil berlangsung 20–31 Desember 2025. Kegiatan belajar aktif kembali pada 2 Januari 2026.', ['Wali murid diimbau tetap mendampingi anak membaca dan mengerjakan tugas liburan yang ringan.']],
    ['Pembagian Rapor 19 Desember 2025', 'announcement', '2025-12-08', 'Rapor semester ganjil dibagikan pada 19 Desember 2025 di kelas masing-masing.', 'Pembagian rapor semester ganjil dilaksanakan Jumat, 19 Desember 2025, pukul 08.00 di kelas masing-masing. Rapor diambil langsung oleh wali murid.', ['Bagi wali yang berhalangan, mohon menghubungi wali kelas untuk penjadwalan ulang.']],
    ['Pekan Karya Wirausaha 8–12 Januari', 'announcement', '2025-12-05', 'Pekan Karya Wirausaha digelar 8–12 Januari 2026 dengan bazar karya murid.', 'Sekolah akan menyelenggarakan Pekan Karya Wirausaha pada 8–12 Januari 2026. Murid memamerkan dan menjual hasil karya di bazar sekolah.', ['Wali murid dan masyarakat diundang hadir mendukung kreativitas dan jiwa wirausaha anak-anak.']],
    ['Info PSB Gelombang 1 Dibuka', 'psb', '2025-12-01', 'Pendaftaran siswa baru gelombang 1 dibuka Januari hingga Maret 2026.', 'Penerimaan Siswa Baru (PSB) tahun ajaran 2026/2027 gelombang 1 resmi dibuka mulai Januari sampai Maret 2026.', ['Pendaftaran dilakukan secara online melalui portal sekolah. Berkas persyaratan dapat diunggah langsung saat mengisi formulir.', 'Informasi lengkap mengenai kuota, biaya, dan jadwal observasi akan diumumkan berkala di portal ini.']]
  ].map(function (a, i) { return { id: i, title: a[0], type: a[1], dateISO: a[2], excerpt: a[3], lead: a[4], body: a[5] }; });
  var accounts = {
    'wali@sekolah.id': { pass: 'wali123', role: 'wali', name: 'Ibu Sari' },
    'staf@sekolah.id': { pass: 'staf123', role: 'staf', name: 'Bapak Andi' }
  };

  // ---- portal alumni (alumni directory + stories) ----
  var alumni = [
    { name: 'dr. Yosafat Rumbewas', lulus: 1990, kegiatan: 'Dokter di RSUD Raja Ampat', star: true, quote: 'Di SD Negeri 8 Arawai saya belajar disiplin dan berani bermimpi besar. Dari bangku sederhana inilah perjalanan saya menuju bangku kedokteran dimulai.' },
    { name: 'Serepina Mayor, S.Pd.', lulus: 2001, kegiatan: 'Guru & Penggerak Literasi', star: true, quote: 'Guru-guru di sini menanamkan cinta membaca sejak dini. Kini saya meneruskan semangat itu kepada anak-anak di kampung halaman.' },
    { name: 'Gerald Wanma', lulus: 2016, kegiatan: 'Mahasiswa Teknik Kelautan & Atlet Renang', star: true, quote: 'Nilai kerja keras dan sportivitas yang saya dapat di sekolah mengantar saya meraih beasiswa dan medali renang tingkat daerah.' },
    { name: 'Marthen Sauyai', lulus: 1985, kegiatan: 'Tokoh Masyarakat & Nelayan' },
    { name: 'Agustina Fakdawer', lulus: 1994, kegiatan: 'Perawat Puskesmas Arawai' },
    { name: 'Yulius Mambrasar', lulus: 1998, kegiatan: 'Wirausaha Homestay Pariwisata' },
    { name: 'Debora Rumadas', lulus: 2005, kegiatan: 'Bidan Desa' },
    { name: 'Frans Ayello', lulus: 2009, kegiatan: 'Anggota Polri (Bhabinkamtibmas)' },
    { name: 'Naomi Mirino', lulus: 2013, kegiatan: 'Mahasiswa Keguruan' },
    { name: 'Kevin Arwam', lulus: 2019, kegiatan: 'Pelajar SMA' },
    { name: 'Priska Wombaki', lulus: 2021, kegiatan: 'Pelajar SMP' },
    { name: 'Michael Rumbruren', lulus: 2023, kegiatan: 'Pelajar SMP' }
  ].map(function (a) { a.ini = ini(a.name.replace(/^(dr\.|drs\.|dra\.|ir\.)\s*/i, '')); return a; });
  var profil = {
    sambutan: 'Selamat datang di portal resmi SD Negeri 8 Arawai. Kami berkomitmen menghadirkan pendidikan dasar yang menyenangkan, membentuk karakter, dan menumbuhkan kreativitas serta jiwa wirausaha setiap murid. Semoga portal ini mempererat kerja sama antara sekolah, murid, dan orang tua.',
    kepsek: 'Bapak Yohanes Rumbewas, S.Pd.',
    dinasSambutan: 'Kami menyambut baik hadirnya portal digital SD Negeri 8 Arawai sebagai wujud transparansi dan pelayanan pendidikan yang semakin dekat dengan masyarakat. Semoga inovasi ini mendorong seluruh sekolah di Raja Ampat untuk terus maju, berintegritas, dan berpihak pada kepentingan peserta didik.',
    dinas: 'Ibu Dra. Maria Wombasi, M.Pd.',
    sejarah: [
      ['1978', 'Berdiri', 'SD Negeri 8 Arawai didirikan untuk melayani pendidikan dasar anak-anak di kawasan Arawai, Raja Ampat.'],
      ['1995', 'Pembangunan', 'Penambahan ruang kelas dan perpustakaan untuk menampung murid yang terus bertambah.'],
      ['2015', 'Akreditasi A', 'Sekolah meraih akreditasi A atas kualitas pembelajaran dan tata kelola.'],
      ['2023', 'Program Wirausaha', 'Meluncurkan program wirausaha cilik dan Pekan Karya Wirausaha tahunan.']
    ],
    nilai: [
      ['🤝', 'Berkarakter', 'Menumbuhkan budi pekerti, kejujuran, dan sopan santun sejak dini.'],
      ['🎨', 'Kreatif', 'Mendorong murid berkarya dan berani mencoba hal baru.'],
      ['🌱', 'Mandiri', 'Membiasakan tanggung jawab dan kepercayaan diri.'],
      ['💚', 'Peduli Lingkungan', 'Membudayakan cinta alam dan kebersihan lingkungan.']
    ],
    fasilitas: [
      ['Ruang Kelas Nyaman', '6 ruang kelas terang dan bersih untuk Kelas 1–6.'],
      ['Perpustakaan', 'Koleksi buku cerita, pelajaran, dan sudut baca yang ramah anak.'],
      ['Kebun Sekolah', 'Kebun mini untuk praktik IPAS dan program berkebun murid.'],
      ['Lapangan', 'Area terbuka untuk PJOK, upacara, dan kegiatan bersama.']
    ]
  };
  var children = [
    { name: 'Kirana Putri', kelas: '1A', ini: 'KP', note: 'Kirana anak yang ceria dan mudah bergaul. Kemampuan membacanya berkembang pesat. Tingkatkan ketelitian dalam berhitung agar hasilnya lebih maksimal.', rapor: [['Bahasa Indonesia', 90], ['Matematika', 85], ['Pendidikan Pancasila', 92], ['Seni & Prakarya', 95], ['Pendidikan Agama', 90], ['PJOK', 88]] },
    { name: 'Rafi Ananda', kelas: '1A', ini: 'RA', note: 'Rafi aktif dan penuh rasa ingin tahu. Sangat menonjol di kegiatan olahraga. Perlu bimbingan agar lebih fokus saat menulis.', rapor: [['Bahasa Indonesia', 82], ['Matematika', 88], ['Pendidikan Pancasila', 85], ['Seni & Prakarya', 86], ['Pendidikan Agama', 89], ['PJOK', 94]] }
  ];

  // ---- state ----
  var state = {
    route: CONFIG.defaultRoute, menu: false,
    jadwalKelas: 1, gmTab: 'guru',
    karyaKelas: 'all', karyaJenis: 'all', karyaSearch: '', karyaDetail: null,
    pustakaSearch: '', pustakaKategori: 'all', pustakaLevel: 'all', pustakaDetail: null, pustakaReading: false, pustakaPage: 0,
    alAngkatan: 'all', alSearch: '', alfNama: '', alfLulus: '', alfKegiatan: '', alfPesan: '', alSent: false, alErr: '',
    kalKat: 'all',
    ppNama: '', ppTgl: '', ppOrtu: '', ppHp: '', ppAlamat: '', ppJalur: 'Zonasi', ppSent: false, ppErr: '',
    artikelSearch: '', artikelShown: 4, artikelDetail: null,
    auth: null, loginEmail: '', loginPass: '', loginError: '',
    waliChild: 0, cmsTab: 'artikel', extraArtikel: 0, scrolled: false,
    adKind: 'keluhan', adAnon: false, adName: '', adEmail: '', adHp: '', adMsg: '', adSent: false, adErr: ''
  };
  function setState(patch) { for (var kk in patch) state[kk] = patch[kk]; render(); }
  function go(r) { setState({ route: r, menu: false, karyaDetail: null, artikelDetail: null, pustakaDetail: null, pustakaReading: false, pustakaPage: 0, alSent: false, alErr: '', ppSent: false, ppErr: '', loginError: '' }); window.scrollTo(0, 0); }

  // ---- reusable partials ----
  function chips(current) {
    return [1, 2, 3, 4, 5, 6].map(function (l) {
      return '<button class="chip ' + (current === l ? 'on' : '') + '" data-action="jadwalKelas" data-k="' + l + '">Kelas ' + l + '</button>';
    }).join('');
  }
  function misiList(arr) {
    return arr.map(function (t, i) { return '<div class="misi-item"><span class="misi-num">' + (i + 1) + '</span><span>' + esc(t) + '</span></div>'; }).join('');
  }
  function sambutanBlocks(mb) {
    return '<div class="card p-sambutan" style="margin-bottom:18px"><div class="p-kepsek-img ph">[ foto kepala dinas ]</div><div><span class="pill">Sambutan Kepala Dinas Pendidikan</span><p class="p-quote" style="margin-top:12px">' + esc(profil.dinasSambutan) + '</p><div class="p-sign">' + esc(profil.dinas) + '<small>Kepala Dinas Pendidikan Kabupaten Raja Ampat</small></div></div></div>' +
      '<div class="card p-sambutan" style="margin-bottom:' + mb + '"><div class="p-kepsek-img ph">[ foto kepala sekolah ]</div><div><span class="pill">Sambutan Kepala Sekolah</span><p class="p-quote" style="margin-top:12px">' + esc(profil.sambutan) + '</p><div class="p-sign">' + esc(profil.kepsek) + '<small>Kepala SD Negeri 8 Arawai</small></div></div></div>';
  }

  // ---- views ----
  function viewBeranda() {
    var anns = articles.filter(function (a) { return a.type === 'announcement' || a.type === 'psb'; }).slice(0, 4).map(function (a) {
      var d = new Date(a.dateISO);
      return '<div class="ann-item" data-action="openArt" data-id="' + a.id + '"><div class="ann-date"><div class="ann-day">' + d.getDate() + '</div><div class="ann-mon">' + months[d.getMonth()] + '</div></div><div><h4>' + esc(a.title) + '</h4><p class="muted" style="font-size:13.5px">' + esc(a.excerpt) + '</p></div></div>';
    }).join('');
    var berita = articles.filter(function (a) { return a.type === 'news'; }).slice(0, 3).map(function (a) {
      return '<div class="news-item" data-action="openArt" data-id="' + a.id + '"><div class="news-thumb ph">foto</div><div><h4>' + esc(a.title) + '</h4><p class="muted" style="font-size:12.5px">' + fmtDate(a.dateISO) + '</p></div></div>';
    }).join('');
    var kelasRingkas = [1, 2, 3, 4, 5, 6].map(function (l) {
      var cs = kurikulum[l].slice(0, 3).map(function (c) { return c[0]; }).join(' · ');
      return '<div class="kelas-card card" data-action="berandaKelas" data-k="' + l + '"><div class="kelas-tag">' + l + '</div><h3>Kelas ' + l + '</h3><div>' + esc(cs) + '</div></div>';
    }).join('');

    return '' +
      '<section class="hero"><div class="hero-bg"></div><div class="hero-fade"></div><div class="hero-toon"><svg class="swinger" viewBox="0 0 130 210" fill="none" stroke="#8a1f2e" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M65 2 Q60 34 66 60" stroke="#2a9d8f" stroke-width="3"/><circle cx="66" cy="78" r="11" fill="#fff"/><path d="M66 60 L52 82 M66 60 L80 82"/><path d="M66 89 L66 132"/><g class="toon-legs"><path d="M66 132 L50 172 M66 132 L82 168"/></g></svg></div><div class="hero-inner"><span class="pill">🍬 Belajar sambil berkarya</span><h1>Tumbuh cerdas, kreatif, dan <em>berkarakter!</em></h1><p class="hero-lead">Portal ceria SD Negeri 8 Arawai — kurikulum, jadwal, karya murid, dan pengumuman dalam satu tempat.</p><div class="hero-cta"><button class="btn btn-p" data-go="ppdb">Info Pendaftaran</button><button class="btn btn-o hero-o" data-go="karya">Lihat Karya Murid</button></div></div></section>' +

      '<section class="wrap sec lay-sec" style="padding-top:8px"><div class="sec-head"><div><span class="eyebrow">Layanan Sekolah</span><h2 class="sec-title" style="margin-top:8px">Layanan Digital Sekolah</h2></div></div><div class="lay-runzone"><div class="lay-runner"><div class="lay-bob"><div class="rn-shout">yeaa aku juara!</div><div class="rn-fig"><svg viewBox="0 0 74 64" fill="none" stroke="#8a1f2e" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="22" cy="13" r="8.4" fill="#fff"/><path d="M18.5 11.5 Q20.5 9.8 22.5 11.5 M25 11.5 Q27 9.8 29 11.5"/><circle cx="23.5" cy="16.5" r="1.7" fill="#8a1f2e" stroke="none"/><path d="M25 21 L18 42"/><g class="rn-arm"><path d="M24 25 L11 21"/></g><g class="rn-leg1"><path d="M18 42 L31 55"/></g><g class="rn-leg2"><path d="M18 42 L5 57"/></g><path d="M24 24 L49 29"/><g stroke-width="2.6"><path d="M45 16 L61 16 L59 25 Q53 31 47 25 Z"/><path d="M45 17 Q39 18 43 25 M61 17 Q67 18 63 25"/><path d="M53 31 L53 36 M48 37 L58 37 M50 40 L56 40"/><path d="M53 36 L49 29" stroke-width="3.4"/><text x="53" y="24" font-size="9" font-weight="800" fill="#8a1f2e" stroke="none" text-anchor="middle" font-family="Baloo 2,cursive">1</text></g></svg></div></div></div></div><div class="lay-grid">' +
      '<button class="lay-card" data-go="akademik"><div class="lay-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M8 4v16"/></svg></div><h4>Sistem Informasi Akademik</h4><p>Data nilai, rapor, dan perkembangan belajar murid dalam satu portal.</p><span class="go">Buka layanan →</span></button>' +
      '<button class="lay-card" data-go="perpustakaan"><div class="lay-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div><h4>Perpustakaan Digital</h4><p>Koleksi buku, cerita, dan bahan bacaan yang bisa diakses kapan saja.</p><span class="go">Buka layanan →</span></button>' +
      '<button class="lay-card gold" data-go="alumni"><div class="lay-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></div><h4>Portal Alumni</h4><p>Wadah silaturahmi dan jejak prestasi para lulusan SD Negeri 8 Arawai.</p><span class="go">Buka layanan →</span></button>' +
      '<button class="lay-card" data-go="guru-murid"><div class="lay-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></div><h4>Guru & Tenaga Kependidikan</h4><p>Direktori guru dan staf pengajar beserta perannya di sekolah.</p><span class="go">Buka layanan →</span></button>' +
      '<button class="lay-card" data-go="kalender"><div class="lay-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div><h4>Kalender Akademik</h4><p>Jadwal kegiatan, asesmen, libur, dan agenda penting sepanjang tahun.</p><span class="go">Buka layanan →</span></button>' +
      '<button class="lay-card gold" data-go="ppdb"><div class="lay-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg></div><h4>PPDB Online</h4><p>Penerimaan peserta didik baru: info gelombang, syarat, jalur, dan formulir pendaftaran.</p><span class="go">Buka layanan →</span></button>' +
      '</div></section>' +

      '<section class="wrap sec" style="padding-top:8px"><div class="sec-head"><div><span class="eyebrow">Profil Sekolah</span><h2 class="sec-title" style="margin-top:8px">Visi & Misi Kami</h2></div><button class="btn btn-g btn-sm" data-go="profil">Semua profil →</button></div>' + sambutanBlocks('22px') + '<div class="vm"><div class="vm-card card"><div class="pill">Visi</div><h3 class="serif" style="margin-top:14px;font-weight:600">“Menjadi sekolah dasar unggul yang membentuk generasi berkarakter, kreatif, dan mandiri.”</h3><p class="muted" style="margin-top:12px">SD Negeri 8 Arawai berlokasi di Jl. Melati No. 8, Arawai, menaungi murid dari Kelas 1 hingga Kelas 6.</p></div><div class="vm-card card"><div class="pill">Misi</div><div style="margin-top:12px">' + misiList(misi) + '</div></div></div></section>' +

      '<section class="wrap sec" style="padding-top:0"><div class="sec-head"><div><span class="eyebrow">Materi & Kurikulum Singkat</span><h2 class="sec-title" style="margin-top:8px">Jenjang Kelas 1 – 6</h2></div><button class="btn btn-g btn-sm" data-go="jadwal">Lihat Kurikulum Lengkap →</button></div><div class="kelas-grid">' + kelasRingkas + '</div></section>' +

      '<section class="wrap sec" style="padding-top:0"><div class="psb"><div><div class="psb-period">◷ Gelombang 1: Januari – Maret 2026</div><h2>Penerimaan Siswa Baru 2026/2027</h2><p>Bergabunglah bersama keluarga besar SD Negeri 8 Arawai. Daftarkan putra-putri Anda dan mulai perjalanan belajar yang menyenangkan.</p><div class="hero-cta"><button class="btn btn-light" data-go="ppdb">Daftar Sekarang</button><button class="btn btn-o" style="color:#fff;border-color:rgba(255,255,255,.5)" data-go="ppdb">Info Lengkap PSB</button></div></div><div class="psb-steps"><div style="font-weight:800;margin-bottom:6px">Alur singkat</div><div class="psb-step"><b>1</b><span>Isi formulir pendaftaran online.</span></div><div class="psb-step"><b>2</b><span>Unggah berkas persyaratan.</span></div><div class="psb-step"><b>3</b><span>Verifikasi & observasi anak.</span></div><div class="psb-step"><b>4</b><span>Pengumuman & daftar ulang.</span></div></div></div></section>' +

      '<section class="wrap sec" style="padding-top:0"><div class="two-col"><div><div class="sec-head" style="margin-bottom:8px"><h2 class="sec-title" style="font-size:23px">Pengumuman Terbaru</h2></div>' + anns + '</div><div><div class="sec-head" style="margin-bottom:8px"><h2 class="sec-title" style="font-size:23px">Berita Terkini</h2></div><div class="card" style="padding:6px 18px">' + berita + '</div></div></div></section>';
  }

  function viewProfil() {
    var sejarah = profil.sejarah.map(function (e) { return '<div class="p-tli"><div class="p-year">' + esc(e[0]) + '</div><h4>' + esc(e[1]) + '</h4><p>' + esc(e[2]) + '</p></div>'; }).join('');
    var nilai = profil.nilai.map(function (n) { return '<div class="p-nc card"><div class="ic">' + n[0] + '</div><h4>' + esc(n[1]) + '</h4><p>' + esc(n[2]) + '</p></div>'; }).join('');
    var fasil = profil.fasilitas.map(function (f) { return '<div class="p-fc card"><div class="n">✦</div><div><h4>' + esc(f[0]) + '</h4><p>' + esc(f[1]) + '</p></div></div>'; }).join('');
    return '<section class="wrap sec"><div class="p-hero"><span class="pill">Profil Sekolah</span><h1>Mengenal SD Negeri 8 Arawai</h1><p>Sekolah dasar terakreditasi A di Araway, Raja Ampat, yang membentuk generasi berkarakter, kreatif, dan mandiri melalui pembelajaran yang menyenangkan dan penuh keteladanan.</p></div>' +
      sambutanBlocks('34px') +
      '<div class="vm" style="margin-bottom:38px"><div class="vm-card card"><div class="pill">Visi</div><h3 class="serif" style="margin-top:14px;font-weight:600">“Menjadi sekolah dasar unggul yang membentuk generasi berkarakter, kreatif, dan mandiri.”</h3></div><div class="vm-card card"><div class="pill">Misi</div><div style="margin-top:12px">' + misiList(misi) + '</div></div></div>' +
      '<div class="sec-head"><h2 class="sec-title" style="font-size:24px">Nilai yang Kami Tanamkan</h2></div><div class="p-nilai" style="margin-bottom:40px">' + nilai + '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:38px;align-items:start" class="two-col"><div><div class="sec-head" style="margin-bottom:18px"><h2 class="sec-title" style="font-size:24px">Sejarah Singkat</h2></div><div class="p-tl">' + sejarah + '</div></div><div><div class="sec-head" style="margin-bottom:18px"><h2 class="sec-title" style="font-size:24px">Fasilitas</h2></div><div class="p-fas">' + fasil + '</div></div></div></section>';
  }

  function viewJadwal() {
    var rows = jadwal[state.jadwalKelas].map(function (r) {
      return '<tr><td class="hari">' + r.hari + '</td><td>' + r.pelajaran.map(function (mp) { return '<span class="mp-tag">' + esc(mp) + '</span>'; }).join('') + '</td></tr>';
    }).join('');
    var materi = kurikulum[state.jadwalKelas].map(function (c) { return '<div class="materi-item"><h4>' + esc(c[0]) + '</h4><p class="muted" style="font-size:14px">' + esc(c[1]) + '</p></div>'; }).join('');
    return '<section class="wrap sec"><span class="eyebrow">Kurikulum</span><h1 class="sec-title" style="font-size:34px;margin-top:8px">Jadwal & Kurikulum</h1><p class="muted" style="margin-top:8px;max-width:44em">Pilih jenjang kelas untuk melihat jadwal pelajaran harian dan rincian materi pokok yang dipelajari.</p><div class="chips" style="margin:26px 0 30px">' + chips(state.jadwalKelas) + '</div><div style="display:grid;grid-template-columns:1.15fr .85fr;gap:34px;align-items:start" class="jadwal-grid"><div><h3 style="font-size:18px;font-weight:800;margin-bottom:14px">Jadwal Pelajaran · Kelas ' + state.jadwalKelas + '</h3><table class="sched"><thead><tr><th>Hari</th><th>Mata Pelajaran</th></tr></thead><tbody>' + rows + '</tbody></table></div><div><h3 style="font-size:18px;font-weight:800;margin-bottom:14px">Materi Pokok · Kelas ' + state.jadwalKelas + '</h3><div class="card">' + materi + '</div></div></div></section>';
  }

  function viewGuruMurid() {
    var guruTab = state.gmTab === 'guru';
    var guru = teachers.map(function (g) { return '<div class="guru-card card"><div class="avatar">' + g.ini + '</div><div><h4>' + esc(g.name) + '</h4><span class="pill">' + esc(g.role) + '</span></div></div>'; }).join('');
    var murid = students[state.jadwalKelas].map(function (s) { return '<div class="murid-item card"><span class="murid-no">' + s.no + '</span><div class="avatar">' + s.ini + '</div><span style="font-weight:600">' + esc(s.name) + '</span></div>'; }).join('');
    var body = guruTab
      ? '<div class="guru-grid">' + guru + '</div>'
      : '<div><div class="chips" style="margin-bottom:24px">' + chips(state.jadwalKelas) + '</div><h3 style="font-size:17px;font-weight:800;margin-bottom:16px">Murid Kelas ' + state.jadwalKelas + 'A · ' + students[state.jadwalKelas].length + ' murid</h3><div class="murid-grid">' + murid + '</div></div>';
    return '<section class="wrap sec"><span class="eyebrow">Direktori</span><h1 class="sec-title" style="font-size:34px;margin-top:8px">Data Guru & Murid</h1><p class="muted" style="margin-top:8px;max-width:44em">Kenali para pengajar dan komposisi murid tiap kelas. Demi privasi, tidak ada data kontak, NIK, atau alamat yang ditampilkan.</p><div class="tabs" style="margin:24px 0 30px"><button class="tab ' + (guruTab ? 'on' : '') + '" data-action="gmTab" data-tab="guru">Guru Pengajar</button><button class="tab ' + (!guruTab ? 'on' : '') + '" data-action="gmTab" data-tab="murid">Murid per Kelas</button></div>' + body + '</section>';
  }

  function viewKarya() {
    var kd = works.filter(function (w) { return w.id === state.karyaDetail; })[0];
    if (kd) {
      return '<section class="wrap sec"><button class="back" data-action="karyaClose">← Kembali ke galeri</button><div class="detail-grid"><div class="detail-img ph">[ foto karya besar ]</div><div><span class="pill">Kelas ' + kd.kelas + ' · ' + esc(kd.jenis) + '</span><h1 class="sec-title" style="font-size:32px;margin:14px 0 16px">' + esc(kd.title) + '</h1><p style="font-size:16px;line-height:1.75;color:#332c29">' + esc(kd.description) + '</p><div class="maker"><div class="avatar">' + kd.ini + '</div><div><div class="muted" style="font-size:12.5px;font-weight:700">Karya oleh</div><div style="font-weight:800;font-size:16px">' + esc(kd.student) + '</div><div class="muted" style="font-size:13px">Kelas ' + kd.kelas + 'A</div></div></div></div></div></section>';
    }
    var kl = works.filter(function (w) { return (state.karyaKelas === 'all' || String(w.kelas) === state.karyaKelas) && (state.karyaJenis === 'all' || w.jenis === state.karyaJenis); });
    var q = state.karyaSearch.trim().toLowerCase();
    if (q) kl = kl.filter(function (w) { return (w.title + ' ' + w.description).toLowerCase().indexOf(q) !== -1; });
    var grid = kl.map(function (w) { return '<div class="karya-card card" data-action="karyaOpen" data-id="' + w.id + '"><div class="karya-img ph">[ foto karya ]</div><div class="karya-body"><h4>' + esc(w.title) + '</h4><div class="karya-meta"><span class="pill">Kelas ' + w.kelas + '</span><span>·</span><span>' + esc(w.jenis) + '</span></div><p class="muted" style="font-size:13px;margin-top:10px">oleh ' + esc(w.student) + '</p></div></div>'; }).join('');
    var opt = function (v, label, cur) { return '<option value="' + v + '"' + (cur === v ? ' selected' : '') + '>' + label + '</option>'; };
    var empty = kl.length === 0 ? '<div class="empty card"><div class="empty-ic">🔍</div><div style="font-weight:700">Tidak ada karya yang cocok</div><p class="muted" style="font-size:14px">Coba ubah kata kunci atau filter kelas/jenis.</p></div>' : '';
    return '<section class="wrap sec"><div><span class="eyebrow">Etalase Kreativitas</span><h1 class="sec-title" style="font-size:34px;margin-top:8px">Ruang Karya Murid</h1><p class="muted" style="margin-top:8px;max-width:44em">Galeri hasil karya kewirausahaan dan kreativitas murid SD Negeri 8 Arawai. Klik sebuah karya untuk melihat detailnya.</p><div class="filter-bar" style="margin-top:26px"><div class="search"><span style="color:var(--muted)">⌕</span><input placeholder="Cari judul atau deskripsi karya…" value="' + esc(state.karyaSearch) + '" data-model="karyaSearch" data-focus="karyaSearch"></div>' +
      '<select class="select" data-model="karyaKelas">' + opt('all', 'Semua Kelas', state.karyaKelas) + opt('1', 'Kelas 1', state.karyaKelas) + opt('2', 'Kelas 2', state.karyaKelas) + opt('3', 'Kelas 3', state.karyaKelas) + opt('4', 'Kelas 4', state.karyaKelas) + opt('5', 'Kelas 5', state.karyaKelas) + opt('6', 'Kelas 6', state.karyaKelas) + '</select>' +
      '<select class="select" data-model="karyaJenis">' + opt('all', 'Semua Jenis', state.karyaJenis) + opt('Kerajinan', 'Kerajinan', state.karyaJenis) + opt('Kuliner', 'Kuliner', state.karyaJenis) + opt('Seni', 'Seni', state.karyaJenis) + opt('Digital', 'Digital', state.karyaJenis) + '</select></div>' +
      empty + '<div class="karya-grid ' + (CONFIG.compactCards ? 'compact' : '') + '">' + grid + '</div><p class="muted" style="text-align:center;margin-top:26px;font-size:13.5px">Menampilkan ' + kl.length + ' karya</p></div></section>';
  }

  // ---- perpustakaan digital helpers + view ----
  function bookCls(kat) {
    return { 'Dongeng & Cerita': 'bc0', 'Pengetahuan': 'bc1', 'Pelajaran': 'bc2', 'Wirausaha': 'bc3', 'Komik': 'bc4' }[kat] || 'bc1';
  }
  function bookEmoji(kat) {
    return { 'Dongeng & Cerita': '📖', 'Pengetahuan': '🔭', 'Pelajaran': '✏️', 'Wirausaha': '💡', 'Komik': '💥' }[kat] || '📚';
  }
  function stars(r) {
    var full = Math.round(r);
    var s = '';
    for (var i = 1; i <= 5; i++) s += '<span class="' + (i <= full ? 'on' : '') + '">★</span>';
    return '<span class="stars">' + s + '</span><span class="rate-n">' + r.toFixed(1) + '</span>';
  }
  function bookCover(b, size) {
    return '<div class="book-cover ' + bookCls(b.kategori) + ' ' + (size || '') + '"><span class="bc-emoji">' + bookEmoji(b.kategori) + '</span><div class="bc-txt"><div class="bc-title">' + esc(b.title) + '</div><div class="bc-author">' + esc(b.author) + '</div></div></div>';
  }

  function viewPerpustakaan() {
    var bd = pustaka.filter(function (b) { return b.id === state.pustakaDetail; })[0];
    if (bd) {
      if (state.pustakaReading) {
        var total = bd.isi.length;
        var pg = Math.min(state.pustakaPage, total - 1);
        var prevD = pg <= 0 ? ' disabled' : '';
        var nextLabel = pg >= total - 1 ? 'Selesai' : 'Lanjut →';
        return '<section class="wrap sec"><button class="back" data-action="pustakaCloseRead">← Kembali ke detail buku</button>' +
          '<div class="reader"><div class="reader-head"><span class="pill">' + esc(bd.kategori) + '</span><h1>' + esc(bd.title) + '</h1><p class="muted" style="font-size:13.5px;font-weight:600;margin-top:6px">' + esc(bd.author) + '</p></div>' +
          '<div class="reader-page"><span class="reader-drop">' + esc(bd.isi[pg].charAt(0)) + '</span>' + esc(bd.isi[pg].slice(1)) + '</div>' +
          '<div class="reader-nav"><button class="btn btn-g btn-sm" data-action="pustakaPrev"' + prevD + '>← Sebelumnya</button><span class="reader-count">Halaman ' + (pg + 1) + ' / ' + total + '</span><button class="btn btn-p btn-sm" data-action="pustakaNext">' + nextLabel + '</button></div>' +
          '<div class="reader-progress"><span style="width:' + Math.round(((pg + 1) / total) * 100) + '%"></span></div></div></section>';
      }
      return '<section class="wrap sec"><button class="back" data-action="pustakaClose">← Kembali ke perpustakaan</button>' +
        '<div class="book-detail"><div>' + bookCover(bd, 'big') + '<button class="btn btn-p" style="width:100%;justify-content:center;margin-top:18px" data-action="pustakaRead">📖 Baca Buku</button></div>' +
        '<div><span class="pill">' + esc(bd.kategori) + '</span><h1 class="sec-title" style="font-size:32px;margin:14px 0 10px">' + esc(bd.title) + '</h1><div class="book-rate">' + stars(bd.rating) + '</div>' +
        '<div class="book-meta"><div><span class="muted">Penulis</span><b>' + esc(bd.author) + '</b></div><div><span class="muted">Tingkat</span><b>' + esc(bd.level) + '</b></div><div><span class="muted">Halaman</span><b>' + bd.halaman + '</b></div><div><span class="muted">Tahun</span><b>' + bd.tahun + '</b></div></div>' +
        '<h3 style="font-size:17px;font-weight:800;margin:22px 0 8px">Sinopsis</h3><p style="font-size:15.5px;line-height:1.75;color:#4a3a34">' + esc(bd.sinopsis) + '</p></div></div></section>';
    }

    var list = pustaka.filter(function (b) {
      return (state.pustakaKategori === 'all' || b.kategori === state.pustakaKategori) && (state.pustakaLevel === 'all' || b.level === state.pustakaLevel);
    });
    var q = state.pustakaSearch.trim().toLowerCase();
    if (q) list = list.filter(function (b) { return (b.title + ' ' + b.author + ' ' + b.sinopsis).toLowerCase().indexOf(q) !== -1; });
    var grid = list.map(function (b) {
      return '<div class="book-card" data-action="pustakaOpen" data-id="' + b.id + '">' + bookCover(b) +
        '<div class="book-body"><h4>' + esc(b.title) + '</h4><p class="muted" style="font-size:12.5px">' + esc(b.author) + '</p><div class="book-tags"><span class="pill">' + esc(b.level) + '</span><span class="book-rate sm">' + stars(b.rating) + '</span></div></div></div>';
    }).join('');
    var opt = function (v, label, cur) { return '<option value="' + v + '"' + (cur === v ? ' selected' : '') + '>' + label + '</option>'; };
    var katOpts = pustakaKategoriList.map(function (k) { return opt(k, k, state.pustakaKategori); }).join('');
    var levels = ['Umum', 'Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];
    var levOpts = levels.map(function (l) { return opt(l, l, state.pustakaLevel); }).join('');
    var empty = list.length === 0 ? '<div class="empty card"><div class="empty-ic">📚</div><div style="font-weight:700">Buku tidak ditemukan</div><p class="muted" style="font-size:14px">Coba ubah kata kunci, kategori, atau tingkat kelas.</p></div>' : '';
    return '<section class="wrap sec"><div class="pustaka-hero"><div><span class="pill" style="background:rgba(255,255,255,.16);color:#fff">Perpustakaan Digital</span><h1>Jendela Ilmu SD Negeri 8 Arawai</h1><p>Koleksi buku cerita, pengetahuan, dan bacaan wirausaha yang bisa dibaca kapan saja, di mana saja — langsung dari layar.</p></div><div class="pustaka-hero-stats"><div><b>' + pustaka.length + '</b><span>Judul Buku</span></div><div><b>' + pustakaKategoriList.length + '</b><span>Kategori</span></div><div><b>24/7</b><span>Akses</span></div></div></div>' +
      '<div class="filter-bar" style="margin-top:30px"><div class="search"><span style="color:var(--muted)">⌕</span><input placeholder="Cari judul, penulis, atau topik…" value="' + esc(state.pustakaSearch) + '" data-model="pustakaSearch" data-focus="pustakaSearch"></div>' +
      '<select class="select" data-model="pustakaKategori">' + opt('all', 'Semua Kategori', state.pustakaKategori) + katOpts + '</select>' +
      '<select class="select" data-model="pustakaLevel">' + opt('all', 'Semua Tingkat', state.pustakaLevel) + levOpts + '</select></div>' +
      empty + '<div class="pustaka-grid">' + grid + '</div><p class="muted" style="text-align:center;margin-top:26px;font-size:13.5px">Menampilkan ' + list.length + ' dari ' + pustaka.length + ' buku</p></section>';
  }

  function viewArtikel() {
    var ad = articles.filter(function (a) { return a.id === state.artikelDetail; })[0];
    if (ad) {
      var body = ad.body.map(function (par) { return '<p>' + esc(par) + '</p>'; }).join('');
      return '<section class="wrap sec"><div class="read"><button class="back" data-action="artClose">← Kembali ke Daftar Berita</button><span class="tag-t">' + typeLabel(ad.type) + '</span><h1 style="margin-top:12px">' + esc(ad.title) + '</h1><p class="muted" style="font-size:13.5px;font-weight:600;margin-top:10px">' + fmtDate(ad.dateISO) + ' · Redaksi SDN 8 Arawai</p><div class="read-hero ph">[ gambar utama artikel ]</div><div class="read-body"><p class="serif">' + esc(ad.lead) + '</p>' + body + '</div><div style="border-top:1px solid var(--line);margin-top:28px;padding-top:24px"><button class="btn btn-g" data-action="artClose">← Kembali ke Daftar Berita</button></div></div></section>';
    }
    var aq = state.artikelSearch.trim().toLowerCase();
    var al = articles.slice().sort(function (a, b) { return b.dateISO.localeCompare(a.dateISO); });
    if (aq) al = al.filter(function (a) { return (a.title + ' ' + a.excerpt).toLowerCase().indexOf(aq) !== -1; });
    var shown = al.slice(0, state.artikelShown).map(function (a) {
      return '<div class="art-item" data-action="openArt" data-id="' + a.id + '"><div class="art-thumb ph">[ gambar ]</div><div><div class="art-date"><span class="tag-t">' + typeLabel(a.type) + '</span><span>' + fmtDate(a.dateISO) + '</span></div><h3>' + esc(a.title) + '</h3><p class="muted" style="font-size:14.5px">' + esc(a.excerpt) + '</p></div></div>';
    }).join('');
    var empty = al.length === 0 ? '<div class="empty card"><div class="empty-ic">📰</div><div style="font-weight:700">Tidak ada artikel yang sesuai</div><p class="muted" style="font-size:14px">Tidak ada artikel yang sesuai dengan kata kunci tersebut.</p></div>' : '';
    var more = al.length > state.artikelShown ? '<button class="btn btn-o" data-action="loadMore">Muat Lebih Banyak</button>' : '';
    return '<section class="wrap sec"><div><span class="eyebrow">Kabar Sekolah</span><h1 class="sec-title" style="font-size:34px;margin-top:8px">Artikel & Berita</h1><div class="search" style="max-width:420px;margin:22px 0 12px"><span style="color:var(--muted)">⌕</span><input placeholder="Cari berita atau pengumuman lama…" value="' + esc(state.artikelSearch) + '" data-action="artSearch" data-focus="artSearch"></div>' + empty + '<div class="art-list">' + shown + '</div><div style="text-align:center;margin-top:32px">' + more + '</div></div></section>';
  }

  function viewAduan() {
    if (state.adSent) {
      return '<section class="wrap sec"><div class="aduan"><div style="text-align:center;margin-bottom:22px"><span class="eyebrow">Layanan Aduan</span><h1 class="sec-title" style="font-size:30px;margin-top:8px">Sampaikan Aduan & Saran</h1></div><div class="card aduan-ok"><div class="ic">✓</div><h3>Terima kasih!</h3><p class="muted" style="max-width:34em;margin:0 auto">Aduan/saran Anda telah kami terima dan akan ditindaklanjuti oleh pihak sekolah. Kerahasiaan Anda kami jaga.</p><button class="btn btn-p" style="margin-top:22px" data-action="resetAduan">Kirim aduan lain</button></div></div></section>';
    }
    var err = state.adErr ? '<div class="err">' + esc(state.adErr) + '</div>' : '';
    var identity = !state.adAnon ? '<div class="dp-grid"><div class="field"><label>Nama</label><input type="text" placeholder="Nama lengkap" value="' + esc(state.adName) + '" data-model="adName" data-focus="adName"></div><div class="field"><label>Nomor HP</label><input type="tel" placeholder="08xx-xxxx-xxxx" value="' + esc(state.adHp) + '" data-model="adHp" data-focus="adHp"></div></div><div class="field"><label>Email</label><input type="email" placeholder="nama@email.com" value="' + esc(state.adEmail) + '" data-model="adEmail" data-focus="adEmail"></div>' : '';
    return '<section class="wrap sec"><div class="aduan"><div style="text-align:center;margin-bottom:22px"><span class="eyebrow">Layanan Aduan</span><h1 class="sec-title" style="font-size:30px;margin-top:8px">Sampaikan Aduan & Saran</h1><p class="muted" style="font-size:14.5px;margin-top:8px;max-width:40em;margin-left:auto;margin-right:auto">Laporkan keluhan atau berikan saran untuk SD Negeri 8 Arawai. Anda dapat mengirim secara anonim, atau sertakan identitas agar kami bisa menindaklanjuti.</p></div><div class="card aduan-card">' + err + '<div class="field"><label>Jenis</label><div class="seg"><button class="' + (state.adKind === 'keluhan' ? 'on' : '') + '" data-action="adKind" data-kind="keluhan">⚠ Keluhan</button><button class="' + (state.adKind === 'saran' ? 'on' : '') + '" data-action="adKind" data-kind="saran">💡 Saran</button></div></div><div class="anon-row"><div class="t"><b>Kirim sebagai anonim</b><p>Identitas Anda tidak akan diminta maupun ditampilkan.</p></div><button class="switch ' + (state.adAnon ? 'on' : '') + '" data-action="toggleAnon" aria-label="Mode anonim"></button></div>' + identity + '<div class="field"><label>Isi Aduan / Saran</label><textarea placeholder="Tuliskan keluhan atau saran Anda selengkap mungkin…" data-model="adMsg" data-focus="adMsg">' + esc(state.adMsg) + '</textarea></div><button class="btn btn-p" style="width:100%;justify-content:center" data-action="submitAduan">Kirim Aduan</button></div></div></section>';
  }

  function viewAlumni() {
    var years = alumni.map(function (a) { return a.lulus; }).filter(function (v, i, arr) { return arr.indexOf(v) === i; }).sort(function (a, b) { return b - a; });
    var featured = alumni.filter(function (a) { return a.star; }).map(function (a) {
      return '<div class="alum-card card"><div class="alum-star">★ Alumni Inspiratif</div><div class="alum-top"><div class="avatar">' + a.ini + '</div><div><h4>' + esc(a.name) + '</h4><span class="alum-meta">Angkatan ' + a.lulus + ' · ' + esc(a.kegiatan) + '</span></div></div><p class="alum-quote">“' + esc(a.quote) + '”</p></div>';
    }).join('');
    var dir = alumni.filter(function (a) { return state.alAngkatan === 'all' || String(a.lulus) === state.alAngkatan; });
    var q = state.alSearch.trim().toLowerCase();
    if (q) dir = dir.filter(function (a) { return (a.name + ' ' + a.kegiatan).toLowerCase().indexOf(q) !== -1; });
    dir = dir.slice().sort(function (a, b) { return b.lulus - a.lulus; });
    var dirHtml = dir.map(function (a) {
      return '<div class="alum-item card"><div class="avatar">' + a.ini + '</div><div><div class="alum-name">' + esc(a.name) + '</div><div class="alum-sub"><span class="alum-badge">Lulus ' + a.lulus + '</span>' + esc(a.kegiatan) + '</div></div></div>';
    }).join('');
    var empty = dir.length === 0 ? '<div class="empty card"><div class="empty-ic">🎓</div><div style="font-weight:700">Alumni tidak ditemukan</div><p class="muted" style="font-size:14px">Coba ubah kata kunci atau pilih angkatan lain.</p></div>' : '';
    var opt = function (v, l, c) { return '<option value="' + v + '"' + (c === v ? ' selected' : '') + '>' + l + '</option>'; };
    var yearOpts = years.map(function (y) { return opt(String(y), 'Angkatan ' + y, state.alAngkatan); }).join('');

    var formInner;
    if (state.alSent) {
      formInner = '<div class="card aduan-ok"><div class="ic">✓</div><h3>Terima kasih!</h3><p class="muted" style="max-width:34em;margin:0 auto">Data alumni Anda telah kami terima dan akan ditambahkan ke buku alumni sekolah. Sampai jumpa di kegiatan alumni berikutnya!</p><button class="btn btn-p" style="margin-top:22px" data-action="resetAlumni">Daftarkan alumni lain</button></div>';
    } else {
      var err = state.alErr ? '<div class="err">' + esc(state.alErr) + '</div>' : '';
      formInner = '<div class="card aduan-card">' + err + '<div class="dp-grid"><div class="field"><label>Nama Lengkap</label><input type="text" placeholder="Nama Anda" value="' + esc(state.alfNama) + '" data-model="alfNama" data-focus="alfNama"></div><div class="field"><label>Tahun Lulus</label><input type="text" placeholder="mis. 2015" value="' + esc(state.alfLulus) + '" data-model="alfLulus" data-focus="alfLulus"></div></div><div class="field"><label>Kegiatan / Pekerjaan Sekarang</label><input type="text" placeholder="mis. Pelajar SMP · Guru · Wirausaha" value="' + esc(state.alfKegiatan) + '" data-model="alfKegiatan" data-focus="alfKegiatan"></div><div class="field"><label>Pesan &amp; Kesan untuk Sekolah</label><textarea placeholder="Bagikan kenangan atau pesan Anda untuk almamater…" data-model="alfPesan" data-focus="alfPesan">' + esc(state.alfPesan) + '</textarea></div><button class="btn btn-p" style="width:100%;justify-content:center" data-action="submitAlumni">Kirim Data Alumni</button></div>';
    }

    return '<section class="wrap sec">' +
      '<div class="pustaka-hero alumni"><div><span class="pill" style="background:rgba(255,255,255,.16);color:#fff">Jejak Lulusan</span><h1>Portal Alumni SD Negeri 8 Arawai</h1><p>Rumah digital para lulusan sejak 1978 — tempat bersilaturahmi, berbagi kisah sukses, dan menginspirasi generasi penerus di Arawai, Raja Ampat.</p><div class="hero-cta"><a class="btn btn-light" href="#daftar-alumni">Daftar sebagai Alumni</a></div></div><div class="pustaka-hero-stats"><div><b>' + alumni.length + '</b><span>Alumni Terdata</span></div><div><b>' + years.length + '</b><span>Angkatan</span></div><div><b>1978</b><span>Sejak Berdiri</span></div></div></div>' +
      '<div class="sec-head" style="margin-top:44px"><div><span class="eyebrow">Kisah Inspiratif</span><h2 class="sec-title" style="margin-top:8px">Jejak Langkah Alumni</h2></div></div><div class="alum-grid">' + featured + '</div>' +
      '<div class="sec-head" style="margin-top:48px"><div><span class="eyebrow">Direktori</span><h2 class="sec-title" style="margin-top:8px">Data Alumni per Angkatan</h2></div></div><p class="muted" style="max-width:48em;margin:-8px 0 20px">Demi privasi, hanya nama, tahun lulus, dan kegiatan yang ditampilkan — tanpa nomor kontak atau alamat.</p><div class="filter-bar"><div class="search"><span style="color:var(--muted)">⌕</span><input placeholder="Cari nama atau kegiatan alumni…" value="' + esc(state.alSearch) + '" data-model="alSearch" data-focus="alSearch"></div><select class="select" data-model="alAngkatan">' + opt('all', 'Semua Angkatan', state.alAngkatan) + yearOpts + '</select></div>' + empty + '<div class="alum-dir">' + dirHtml + '</div><p class="muted" style="text-align:center;margin-top:22px;font-size:13.5px">Menampilkan ' + dir.length + ' alumni</p>' +
      '<div class="psb gold" style="margin-top:48px"><div><span class="psb-period">◷ Silaturahmi tanpa batas waktu</span><h2>Ikatan Alumni Arawai</h2><p>Wadah para lulusan untuk saling terhubung, berbagi inspirasi, dan memberi kontribusi bagi almamater tercinta.</p></div><div class="psb-steps"><div style="font-weight:800;margin-bottom:6px">Agenda Alumni</div><div class="psb-step"><b>♦</b><span>Reuni Akbar setiap Hari Ulang Tahun Sekolah.</span></div><div class="psb-step"><b>♦</b><span>Sharing Alumni: berbagi kisah untuk adik kelas.</span></div><div class="psb-step"><b>♦</b><span>Bakti sosial &amp; bantuan perlengkapan belajar.</span></div></div></div>' +
      '<div id="daftar-alumni" style="margin-top:48px"><div class="sec-head"><div><span class="eyebrow">Buku Alumni</span><h2 class="sec-title" style="margin-top:8px">Daftar sebagai Alumni</h2></div></div><p class="muted" style="max-width:48em;margin:-8px 0 20px">Sudah lulus dari SD Negeri 8 Arawai? Isi buku alumni digital ini agar tetap terhubung dengan sekolah dan adik-adik kelas.</p><div class="aduan" style="margin:0">' + formInner + '</div></div>' +
      '</section>';
  }

  function viewKalender() {
    var agenda = [
      ['14 Jul 2025', 'kegiatan', 'Hari Pertama Masuk Sekolah', 'Awal Semester Ganjil Tahun Ajaran 2025/2026.'],
      ['14–16 Jul 2025', 'kegiatan', 'Masa Pengenalan Lingkungan Sekolah', 'Pengenalan sekolah bagi murid baru Kelas 1.'],
      ['17 Agu 2025', 'kegiatan', 'Upacara HUT Kemerdekaan RI', 'Peringatan Hari Kemerdekaan Republik Indonesia.'],
      ['15–20 Sep 2025', 'asesmen', 'Asesmen Sumatif Tengah Semester', 'Penilaian tengah semester ganjil untuk Kelas 1–6.'],
      ['25 Nov 2025', 'kegiatan', 'Peringatan Hari Guru Nasional', 'Apresiasi bagi para guru SD Negeri 8 Arawai.'],
      ['1–6 Des 2025', 'asesmen', 'Asesmen Sumatif Akhir Semester Ganjil', 'Penilaian akhir semester ganjil.'],
      ['19 Des 2025', 'asesmen', 'Pembagian Rapor Semester Ganjil', 'Penerimaan laporan hasil belajar oleh wali murid.'],
      ['20 Des 2025 – 3 Jan 2026', 'libur', 'Libur Semester Ganjil', 'Libur akhir semester ganjil.'],
      ['5 Jan 2026', 'kegiatan', 'Awal Semester Genap', 'Hari pertama masuk pada semester genap.'],
      ['8–12 Jan 2026', 'kegiatan', 'Pekan Karya Wirausaha', 'Bazar dan pameran karya kewirausahaan murid.'],
      ['Jan – Mar 2026', 'psb', 'PPDB Gelombang 1 (TA 2026/2027)', 'Pendaftaran peserta didik baru gelombang pertama.'],
      ['16–21 Mar 2026', 'asesmen', 'Asesmen Sumatif Tengah Semester Genap', 'Penilaian tengah semester genap.'],
      ['Mei 2026', 'asesmen', 'Asesmen Sumatif Kelas 6', 'Penilaian akhir jenjang bagi murid Kelas 6.'],
      ['2–5 Jun 2026', 'asesmen', 'Asesmen Sumatif Akhir Tahun', 'Penilaian kenaikan kelas untuk Kelas 1–5.'],
      ['19 Jun 2026', 'asesmen', 'Pembagian Rapor Semester Genap', 'Penerimaan rapor kenaikan kelas.'],
      ['27 Jun – 11 Jul 2026', 'libur', 'Libur Akhir Tahun Ajaran', 'Libur kenaikan kelas menuju TA 2026/2027.']
    ];
    var catLabel = { kegiatan: 'Kegiatan', asesmen: 'Asesmen', libur: 'Libur', psb: 'PPDB' };
    var chipsRow = [['all', 'Semua'], ['kegiatan', 'Kegiatan'], ['asesmen', 'Asesmen'], ['libur', 'Libur'], ['psb', 'PPDB']].map(function (c) {
      return '<button class="chip ' + (state.kalKat === c[0] ? 'on' : '') + '" data-action="kalKat" data-kat="' + c[0] + '">' + c[1] + '</button>';
    }).join('');
    var rows = agenda.filter(function (a) { return state.kalKat === 'all' || a[1] === state.kalKat; }).map(function (a) {
      return '<div class="kal-row"><div class="kal-date">' + esc(a[0]) + '</div><div class="kal-body"><span class="kal-cat kcat-' + a[1] + '">' + catLabel[a[1]] + '</span><h4>' + esc(a[2]) + '</h4><p>' + esc(a[3]) + '</p></div></div>';
    }).join('');
    return '<section class="wrap sec">' +
      '<div class="pustaka-hero kalender"><div><span class="pill" style="background:rgba(255,255,255,.16);color:#fff">Agenda Sekolah</span><h1>Kalender Akademik 2025/2026</h1><p>Jadwal kegiatan, asesmen, hari libur, dan agenda penting SD Negeri 8 Arawai sepanjang tahun ajaran — dalam satu halaman.</p></div><div class="pustaka-hero-stats"><div><b>2025/26</b><span>Tahun Ajaran</span></div><div><b>2</b><span>Semester</span></div><div><b>' + agenda.length + '</b><span>Agenda</span></div></div></div>' +
      '<div class="kal-sem" style="margin-top:38px"><div class="kal-sem-card card"><div class="kal-sem-ic">📗</div><div><h4>Semester Ganjil</h4><p>14 Juli 2025 – 19 Desember 2025</p></div></div><div class="kal-sem-card card"><div class="kal-sem-ic">📘</div><div><h4>Semester Genap</h4><p>5 Januari 2026 – 19 Juni 2026</p></div></div></div>' +
      '<div class="sec-head"><div><span class="eyebrow">Agenda Tahun Ajaran</span><h2 class="sec-title" style="margin-top:8px">Jadwal Kegiatan &amp; Libur</h2></div></div><div class="chips" style="margin-bottom:22px">' + chipsRow + '</div><div class="card kal-list">' + rows + '</div><p class="muted" style="font-size:13px;margin-top:14px">*Jadwal dapat menyesuaikan kalender resmi Dinas Pendidikan dan kebijakan sekolah.</p>' +
      '</section>';
  }

  function viewPpdb() {
    var jalur = [
      ['📍', 'Jalur Zonasi', 'Prioritas bagi calon murid yang berdomisili paling dekat dengan sekolah, dibuktikan dengan Kartu Keluarga.'],
      ['🤝', 'Jalur Afirmasi', 'Untuk anak dari keluarga kurang mampu atau penyandang disabilitas, dibuktikan dengan DTKS/PIP.'],
      ['🏆', 'Jalur Prestasi', 'Bagi calon murid dengan prestasi akademik maupun non-akademik yang menonjol.'],
      ['🚚', 'Perpindahan Tugas', 'Untuk anak yang mengikuti perpindahan tugas orang tua/wali.']
    ].map(function (j) { return '<div class="sia-card card"><div class="sia-ic">' + j[0] + '</div><h4>' + esc(j[1]) + '</h4><p>' + esc(j[2]) + '</p></div>'; }).join('');
    var langkah = ['Isi formulir pendaftaran online.', 'Unggah berkas persyaratan.', 'Verifikasi berkas oleh panitia.', 'Observasi & wawancara calon murid.', 'Pengumuman hasil seleksi.', 'Daftar ulang & mulai belajar.'].map(function (t, i) {
      return '<div class="psb-step"><b>' + (i + 1) + '</b><span>' + esc(t) + '</span></div>';
    }).join('');

    var formInner;
    if (state.ppSent) {
      formInner = '<div class="card aduan-ok"><div class="ic">✓</div><h3>Pendaftaran Terkirim!</h3><p class="muted" style="max-width:36em;margin:0 auto">Terima kasih, data pendaftaran calon murid telah kami terima. Panitia PPDB akan menghubungi Anda melalui WhatsApp untuk verifikasi berkas dan jadwal observasi.</p><button class="btn btn-p" style="margin-top:22px" data-action="resetPpdb">Daftarkan calon murid lain</button></div>';
    } else {
      var err = state.ppErr ? '<div class="err">' + esc(state.ppErr) + '</div>' : '';
      var jopt = function (v) { return '<option value="' + v + '"' + (state.ppJalur === v ? ' selected' : '') + '>' + v + '</option>'; };
      formInner = '<div class="card aduan-card">' + err +
        '<div class="dp-grid"><div class="field"><label>Nama Lengkap Calon Murid</label><input type="text" placeholder="Nama calon murid" value="' + esc(state.ppNama) + '" data-model="ppNama" data-focus="ppNama"></div><div class="field"><label>Tanggal Lahir</label><input type="text" placeholder="mis. 12/05/2019" value="' + esc(state.ppTgl) + '" data-model="ppTgl" data-focus="ppTgl"></div></div>' +
        '<div class="dp-grid"><div class="field"><label>Nama Orang Tua / Wali</label><input type="text" placeholder="Nama orang tua/wali" value="' + esc(state.ppOrtu) + '" data-model="ppOrtu" data-focus="ppOrtu"></div><div class="field"><label>Nomor WhatsApp</label><input type="tel" placeholder="08xx-xxxx-xxxx" value="' + esc(state.ppHp) + '" data-model="ppHp" data-focus="ppHp"></div></div>' +
        '<div class="field"><label>Jalur Pendaftaran</label><select class="select" style="width:100%" data-model="ppJalur">' + jopt('Zonasi') + jopt('Afirmasi') + jopt('Prestasi') + jopt('Perpindahan Tugas Orang Tua') + '</select></div>' +
        '<div class="field"><label>Alamat Domisili</label><textarea placeholder="Alamat tempat tinggal sesuai Kartu Keluarga…" data-model="ppAlamat" data-focus="ppAlamat">' + esc(state.ppAlamat) + '</textarea></div>' +
        '<button class="btn btn-p" style="width:100%;justify-content:center" data-action="submitPpdb">Kirim Pendaftaran</button>';
    }

    return '<section class="wrap sec">' +
      '<div class="pustaka-hero"><div><span class="pill" style="background:rgba(255,255,255,.16);color:#fff">PPDB Online 2026/2027</span><h1>Penerimaan Peserta Didik Baru</h1><p>Daftarkan putra-putri Anda ke SD Negeri 8 Arawai secara online. Simak jadwal, syarat, dan jalur pendaftaran, lalu isi formulir langsung dari halaman ini.</p><div class="hero-cta"><a class="btn btn-light" href="#daftar-ppdb">Daftar Sekarang</a></div></div><div class="pustaka-hero-stats"><div><b>2</b><span>Gelombang</span></div><div><b>±28</b><span>Kuota/Kelas</span></div><div><b>Gratis</b><span>Biaya (BOS)</span></div></div></div>' +
      '<div class="vm" style="margin-top:38px"><div class="vm-card card"><div class="pill">Gelombang 1</div><h3 class="serif" style="margin-top:12px;font-weight:700;font-size:19px">Januari – Maret 2026</h3><p class="muted" style="margin-top:8px;font-size:14px">Pendaftaran awal dengan kuota lebih luas dan observasi lebih awal.</p></div><div class="vm-card card"><div class="pill">Gelombang 2</div><h3 class="serif" style="margin-top:12px;font-weight:700;font-size:19px">April – Juni 2026</h3><p class="muted" style="margin-top:8px;font-size:14px">Pendaftaran lanjutan selama kuota masih tersedia.</p></div></div>' +
      '<div class="sec-head" style="margin-top:44px"><div><span class="eyebrow">Persyaratan</span><h2 class="sec-title" style="margin-top:8px">Syarat Pendaftaran</h2></div></div><div class="vm"><div class="vm-card card"><div class="pill">Persyaratan Usia</div><div style="margin-top:12px">' + misiList(['Usia 7 tahun per 1 Juli 2026 mendapat prioritas dan wajib diterima.', 'Usia minimal 6 tahun tetap dapat mendaftar.', 'Usia 5 tahun 6 bulan memerlukan rekomendasi psikolog.']) + '</div></div><div class="vm-card card"><div class="pill">Berkas yang Disiapkan</div><div style="margin-top:12px">' + misiList(['Kartu Keluarga (minimal berusia 1 tahun).', 'Akta Kelahiran calon murid.', 'Kartu Identitas Anak (KIA) atau NIK.', 'Pas foto terbaru & bukti DTKS/PIP (jalur afirmasi).']) + '</div></div></div>' +
      '<div class="sec-head" style="margin-top:44px"><div><span class="eyebrow">Jalur Pendaftaran</span><h2 class="sec-title" style="margin-top:8px">Pilihan Jalur Masuk</h2></div></div><div class="sia-grid">' + jalur + '</div>' +
      '<div class="psb" style="margin-top:44px"><div><span class="psb-period">◷ Gelombang 1: Januari – Maret 2026</span><h2>Alur Pendaftaran</h2><p>Ikuti enam langkah mudah berikut untuk mendaftarkan calon murid baru secara online.</p><div class="hero-cta"><a class="btn btn-light" href="#daftar-ppdb">Isi Formulir</a></div></div><div class="psb-steps"><div style="font-weight:800;margin-bottom:6px">Langkah</div>' + langkah + '</div></div>' +
      '<div id="daftar-ppdb" style="margin-top:48px"><div class="sec-head"><div><span class="eyebrow">Formulir</span><h2 class="sec-title" style="margin-top:8px">Formulir Pendaftaran</h2></div></div><p class="muted" style="max-width:48em;margin:-8px 0 20px">Lengkapi data berikut. Setelah dikirim, panitia PPDB akan menghubungi Anda untuk verifikasi berkas dan jadwal observasi.</p><div class="aduan" style="margin:0">' + formInner + '</div></div>' +
      '<div class="sia-note card" style="margin-top:24px"><div class="sia-ic">💬</div><div><h4>Butuh Bantuan?</h4><p>Hubungi panitia PPDB SD Negeri 8 Arawai melalui WhatsApp <b>+62 812-3456-7890</b> pada jam kerja, atau datang langsung ke sekolah di Jl. Melati No. 8, Arawai.</p></div></div>' +
      '</section>';
  }

  function viewAkademik() {
    var modul = [
      ['👦', 'Data Induk Siswa', 'Biodata lengkap murid Kelas 1–6 yang terhubung dengan Dapodik sebagai data pokok pendidikan nasional.'],
      ['🗓️', 'Presensi Digital', 'Pencatatan kehadiran harian secara digital dengan rekap otomatis tiap bulan untuk wali kelas dan wali murid.'],
      ['📊', 'Nilai & Asesmen', 'Nilai asesmen formatif dan sumatif setiap mata pelajaran, diolah sistematis sesuai Kurikulum Merdeka.'],
      ['📄', 'e-Rapor', 'Laporan hasil belajar digital berisi nilai akhir dan deskripsi capaian pembelajaran, dibagikan tiap akhir semester.'],
      ['🎨', 'Projek P5', 'Catatan Projek Penguatan Profil Pelajar Pancasila sebagai bagian penilaian karakter dan kokurikuler.'],
      ['📅', 'Jadwal & Kalender', 'Jadwal pelajaran harian, agenda kegiatan, dan kalender akademik tahun berjalan dalam satu tampilan.'],
      ['📈', 'Perkembangan Belajar', 'Grafik perkembangan nilai dan kehadiran untuk memantau kemajuan belajar anak dari waktu ke waktu.'],
      ['💬', 'Komunikasi Sekolah', 'Catatan wali kelas dan kanal informasi untuk mempererat komunikasi antara guru dan orang tua.']
    ].map(function (m) { return '<div class="sia-card card"><div class="sia-ic">' + m[0] + '</div><h4>' + esc(m[1]) + '</h4><p>' + esc(m[2]) + '</p></div>'; }).join('');
    var fase = [
      ['A', 'Kelas 1 – 2', 'Fondasi literasi dan numerasi awal serta pembiasaan karakter dan budi pekerti.'],
      ['B', 'Kelas 3 – 4', 'Penguatan membaca, menulis, berhitung, dan pengenalan lingkungan melalui IPAS.'],
      ['C', 'Kelas 5 – 6', 'Pendalaman materi, berpikir kritis, dan projek kewirausahaan menuju jenjang berikutnya.']
    ].map(function (f) { return '<div class="fase-card card"><div class="fase-badge">Fase ' + f[0] + '</div><h4>' + esc(f[1]) + '</h4><p>' + esc(f[2]) + '</p></div>'; }).join('');
    var roles = [
      ['🧑‍🍼', 'Wali Murid', 'Melihat rapor, nilai, rekap kehadiran, dan catatan wali kelas untuk putra-putrinya.'],
      ['🧑‍🏫', 'Guru & Wali Kelas', 'Menginput nilai, mengelola presensi, serta menulis deskripsi capaian dan catatan murid.'],
      ['🗂️', 'Admin & Staf TU', 'Mengelola data induk siswa, sinkronisasi Dapodik, dan mengatur akun pengguna.']
    ].map(function (r) { return '<div class="role-card card"><div class="sia-ic">' + r[0] + '</div><div><h4>' + esc(r[1]) + '</h4><p>' + esc(r[2]) + '</p></div></div>'; }).join('');
    return '<section class="wrap sec">' +
      '<div class="pustaka-hero"><div><span class="pill" style="background:rgba(255,255,255,.16);color:#fff">Layanan Akademik</span><h1>Sistem Informasi Akademik</h1><p>Satu portal untuk data siswa, kehadiran, nilai, dan rapor digital SD Negeri 8 Arawai — terhubung dengan Dapodik dan e-Rapor Kurikulum Merdeka, serta dapat diakses wali murid, guru, dan staf secara aman.</p><div class="hero-cta"><button class="btn btn-light" data-go="akses">Masuk ke Portal</button></div></div><div class="pustaka-hero-stats"><div><b>1–6</b><span>Jenjang Kelas</span></div><div><b>A–C</b><span>Fase Belajar</span></div><div><b>e-Rapor</b><span>Digital</span></div></div></div>' +
      '<div class="sec-head" style="margin-top:44px"><div><span class="eyebrow">Modul Layanan</span><h2 class="sec-title" style="margin-top:8px">Yang Bisa Anda Akses</h2></div></div><div class="sia-grid">' + modul + '</div>' +
      '<div class="sec-head" style="margin-top:48px"><div><span class="eyebrow">Penilaian Kurikulum Merdeka</span><h2 class="sec-title" style="margin-top:8px">Belajar Berbasis Fase</h2></div></div><p class="muted" style="max-width:52em;margin:-6px 0 22px">Penilaian mengikuti Kurikulum Merdeka yang berbasis fase. Setiap fase mencakup dua jenjang kelas, mengutamakan asesmen formatif untuk umpan balik, serta asesmen sumatif untuk mengukur ketercapaian tujuan pembelajaran.</p><div class="fase-grid">' + fase + '</div>' +
      '<div class="vm" style="margin-top:20px"><div class="vm-card card"><div class="pill">Asesmen Formatif</div><p style="margin-top:12px;font-size:14.5px;color:#4a3a34;line-height:1.7">Penilaian selama proses belajar untuk memberi umpan balik dan memperbaiki pembelajaran. Diutamakan dalam Kurikulum Merdeka.</p></div><div class="vm-card card"><div class="pill">Asesmen Sumatif</div><p style="margin-top:12px;font-size:14.5px;color:#4a3a34;line-height:1.7">Penilaian di akhir lingkup materi atau semester untuk mengukur ketercapaian tujuan pembelajaran. Nilai akhir rapor menggabungkan keduanya beserta deskripsi capaian.</p></div></div>' +
      '<div class="sec-head" style="margin-top:48px"><div><span class="eyebrow">Hak Akses</span><h2 class="sec-title" style="margin-top:8px">Siapa yang Bisa Masuk?</h2></div></div><div class="role-grid">' + roles + '</div>' +
      '<div class="psb" style="margin-top:44px"><div><span class="psb-period">◷ Akses aman &amp; berjenjang</span><h2>Alur Masuk Portal</h2><p>Login sekali, sistem mengenali peran Anda dan menampilkan data akademik sesuai hak akses. Data pribadi sensitif tidak ditampilkan secara publik.</p><div class="hero-cta"><button class="btn btn-light" data-go="akses">Masuk Sekarang</button></div></div><div class="psb-steps"><div style="font-weight:800;margin-bottom:6px">Langkah</div><div class="psb-step"><b>1</b><span>Masuk dengan akun sekolah Anda.</span></div><div class="psb-step"><b>2</b><span>Sistem mengenali peran: wali murid, guru, atau staf.</span></div><div class="psb-step"><b>3</b><span>Lihat nilai, rapor, dan kehadiran sesuai hak akses.</span></div><div class="psb-step"><b>4</b><span>Unduh rapor &amp; catatan tiap akhir semester.</span></div></div></div>' +
      '<div class="sia-note card" style="margin-top:24px"><div class="sia-ic">🔒</div><div><h4>Terintegrasi &amp; Terlindungi</h4><p>Sistem terhubung dengan <b>Dapodik</b> (Data Pokok Pendidikan) dan <b>e-Rapor</b> Kurikulum Merdeka. Pelaporan hasil belajar dilakukan berkala setiap akhir semester. Akses berjenjang memastikan data murid — seperti NIK dan alamat — tidak ditampilkan secara publik.</p></div></div>' +
      '</section>';
  }

  function viewAkses() {
    if (!state.auth) {
      var err = state.loginError ? '<div class="err">' + esc(state.loginError) + '</div>' : '';
      var hint = CONFIG.showLoginHint ? '<div class="hint">Akun demo untuk mencoba:<br>Wali → <b>wali@sekolah.id</b> / <b>wali123</b><br>Staf → <b>staf@sekolah.id</b> / <b>staf123</b></div>' : '';
      return '<section class="wrap sec"><div class="auth"><div style="text-align:center;margin-bottom:22px"><span class="eyebrow">Akses Khusus</span><h1 class="sec-title" style="font-size:28px;margin-top:8px">Masuk ke Akun Anda</h1><p class="muted" style="font-size:14px;margin-top:6px">Untuk wali murid (lihat rapor) dan staf (kelola konten).</p></div><div class="auth-card card">' + err + '<div class="field"><label>Email</label><input type="email" placeholder="nama@sekolah.id" value="' + esc(state.loginEmail) + '" data-model="loginEmail" data-focus="loginEmail"></div><div class="field"><label>Kata Sandi</label><input type="password" placeholder="••••••••" value="' + esc(state.loginPass) + '" data-model="loginPass" data-focus="loginPass"></div><button class="btn btn-p" style="width:100%;justify-content:center;margin-top:6px" data-action="submitLogin">Masuk</button>' + hint + '</div></div></section>';
    }
    if (state.auth.role === 'wali') return viewWali();
    return viewStaf();
  }

  function viewWali() {
    var child = children[state.waliChild] || children[0];
    var cards = children.map(function (c, i) { return '<div class="child-card card ' + (state.waliChild === i ? 'on' : '') + '" data-action="pickChild" data-i="' + i + '"><div class="avatar">' + c.ini + '</div><div><div style="font-weight:800;font-size:16px">' + esc(c.name) + '</div><div class="muted" style="font-size:13px">Kelas ' + c.kelas + ' · Semester Ganjil</div></div></div>'; }).join('');
    var rows = child.rapor.map(function (r) { return '<tr><td style="font-weight:600">' + esc(r[0]) + '</td><td style="text-align:center"><span class="grade ' + gradeCls(r[1]) + '">' + r[1] + '</span></td><td><span class="pred">' + pred(r[1]) + '</span></td></tr>'; }).join('');
    return '<section class="wrap sec"><div class="dash-head"><div class="who"><div class="avatar" style="background:var(--maroon);color:#fff">W</div><div><div style="font-weight:800;font-size:17px">Halo, ' + esc(state.auth.name) + '</div><div class="muted" style="font-size:13px">Wali Murid · Rapor & Nilai</div></div></div><button class="btn btn-g btn-sm" data-action="logout">Keluar</button></div><h2 class="sec-title" style="font-size:22px;margin-bottom:16px">Pilih Anak</h2><div class="rapor-top">' + cards + '</div><h3 style="font-size:18px;font-weight:800;margin:26px 0 14px">Rapor ' + esc(child.name) + ' — Semester Ganjil 2025/2026</h3><table class="rapor-tbl"><thead><tr><th>Mata Pelajaran</th><th style="text-align:center">Nilai</th><th>Predikat</th></tr></thead><tbody>' + rows + '</tbody></table><div class="summary"><div style="font-weight:800;margin-bottom:6px">Catatan Wali Kelas</div><p style="font-size:14.5px;color:#332c29">' + esc(child.note) + '</p></div></section>';
  }

  function viewStaf() {
    var nav = '<div class="cms-nav"><button class="cms-navb ' + (state.cmsTab === 'artikel' ? 'on' : '') + '" data-action="cmsTab" data-tab="artikel">📰 Artikel & Berita</button><button class="cms-navb ' + (state.cmsTab === 'jadwal' ? 'on' : '') + '" data-action="cmsTab" data-tab="jadwal">🗓 Jadwal & Kurikulum</button><button class="cms-navb ' + (state.cmsTab === 'karya' ? 'on' : '') + '" data-action="cmsTab" data-tab="karya">🎨 Galeri Karya</button></div>';
    var panel = '';
    if (state.cmsTab === 'artikel') {
      var extra = [];
      for (var i = 0; i < state.extraArtikel; i++) extra.push({ title: 'Draf Berita Baru ' + (i + 1), type: 'news', dateISO: '2026-01-0' + (i + 1), _new: true });
      var rowsA = extra.concat(articles.slice().reverse()).map(function (a) { return '<tr><td style="font-weight:700">' + esc(a.title) + (a._new ? '<span class="new-badge">BARU</span>' : '') + '</td><td><span class="tag-t">' + typeLabel(a.type) + '</span></td><td class="muted">' + fmtDate(a.dateISO) + '</td><td style="text-align:right"><button class="iconbtn">Edit</button> <button class="iconbtn del">Hapus</button></td></tr>'; }).join('');
      panel = '<div><div class="sec-head" style="margin-bottom:16px"><h3 style="font-size:18px;font-weight:800">Kelola Artikel & Berita</h3><button class="btn btn-p btn-sm" data-action="addArtikel">+ Tambah Berita</button></div><table class="cms-tbl"><thead><tr><th>Judul</th><th>Jenis</th><th>Tanggal</th><th style="text-align:right">Aksi</th></tr></thead><tbody>' + rowsA + '</tbody></table></div>';
    } else if (state.cmsTab === 'jadwal') {
      var rowsJ = '';
      [1, 2, 3, 6].forEach(function (kk) { kurikulum[kk].slice(0, 1).forEach(function (c) { rowsJ += '<tr><td style="font-weight:700">Kelas ' + kk + '</td><td>' + esc(c[0]) + '</td><td style="text-align:right"><button class="iconbtn">Edit</button> <button class="iconbtn del">Hapus</button></td></tr>'; }); });
      panel = '<div><div class="sec-head" style="margin-bottom:16px"><h3 style="font-size:18px;font-weight:800">Kelola Jadwal & Kurikulum</h3><button class="btn btn-p btn-sm">+ Tambah Materi</button></div><table class="cms-tbl"><thead><tr><th>Kelas</th><th>Mata Pelajaran</th><th style="text-align:right">Aksi</th></tr></thead><tbody>' + rowsJ + '</tbody></table></div>';
    } else {
      var rowsK = works.slice(0, 5).map(function (w) { return '<tr><td style="font-weight:700">' + esc(w.title) + '</td><td><span class="tag-t">Kelas ' + w.kelas + '</span></td><td class="muted">' + esc(w.student) + '</td><td style="text-align:right"><button class="iconbtn">Edit</button> <button class="iconbtn del">Hapus</button></td></tr>'; }).join('');
      panel = '<div><div class="sec-head" style="margin-bottom:16px"><h3 style="font-size:18px;font-weight:800">Kurasi Galeri Karya</h3><button class="btn btn-p btn-sm">+ Tambah Karya</button></div><table class="cms-tbl"><thead><tr><th>Karya</th><th>Kelas</th><th>Pembuat</th><th style="text-align:right">Aksi</th></tr></thead><tbody>' + rowsK + '</tbody></table></div>';
    }
    return '<section class="wrap sec"><div class="dash-head"><div class="who"><div class="avatar" style="background:var(--maroon);color:#fff">S</div><div><div style="font-weight:800;font-size:17px">Panel Manajemen Konten</div><div class="muted" style="font-size:13px">Staf · ' + esc(state.auth.name) + '</div></div></div><button class="btn btn-g btn-sm" data-action="logout">Keluar</button></div><div class="cms-grid">' + nav + '<div>' + panel + '</div></div></section>';
  }

  var VIEWS = {
    beranda: viewBeranda, profil: viewProfil, jadwal: viewJadwal,
    'guru-murid': viewGuruMurid, karya: viewKarya, perpustakaan: viewPerpustakaan,
    akademik: viewAkademik, alumni: viewAlumni, kalender: viewKalender, ppdb: viewPpdb,
    artikel: viewArtikel, aduan: viewAduan, akses: viewAkses
  };

  // ---- render ----
  function render() {
    // focus bookkeeping (preserve caret across full innerHTML swaps)
    var ae = document.activeElement;
    var fk = ae && ae.getAttribute ? ae.getAttribute('data-focus') : null;
    var selS = fk ? ae.selectionStart : null, selE = fk ? ae.selectionEnd : null;

    // header state
    var links = document.querySelectorAll('#nav .navlink');
    for (var i = 0; i < links.length; i++) links[i].classList.toggle('on', links[i].getAttribute('data-route') === state.route);
    document.getElementById('aksesBtn').textContent = state.auth ? 'Akun Saya' : 'Masuk';
    document.getElementById('nav').classList.toggle('open', state.menu);

    // announcement bar
    var abar = document.getElementById('abar-slot');
    abar.innerHTML = (CONFIG.showAnnouncementBar && state.route === 'beranda')
      ? '<div class="abar"><div class="wrap abar-in"><span class="dot"></span><span>PSB Gelombang 1 dibuka — Januari s.d. Maret 2026.</span><a data-go="akses" style="cursor:pointer">Info pendaftaran →</a></div></div>'
      : '';

    // routed view
    document.getElementById('view').innerHTML = (VIEWS[state.route] || viewBeranda)();

    // restore focus
    if (fk) {
      var el = document.querySelector('[data-focus="' + fk + '"]');
      if (el) { el.focus(); try { el.setSelectionRange(selS, selE); } catch (e) {} }
    }
  }

  // ---- event handling (delegation) ----
  function actionHandler(action, ds) {
    switch (action) {
      case 'aduan': setState({ route: 'aduan', menu: false, adSent: false, adErr: '' }); window.scrollTo(0, 0); break;
      case 'jadwalKelas': setState({ jadwalKelas: +ds.k }); break;
      case 'berandaKelas': setState({ route: 'jadwal', jadwalKelas: +ds.k, menu: false }); window.scrollTo(0, 0); break;
      case 'gmTab': setState({ gmTab: ds.tab }); break;
      case 'karyaOpen': setState({ karyaDetail: +ds.id }); window.scrollTo(0, 0); break;
      case 'karyaClose': setState({ karyaDetail: null }); break;
      case 'pustakaOpen': setState({ pustakaDetail: +ds.id, pustakaReading: false, pustakaPage: 0 }); window.scrollTo(0, 0); break;
      case 'pustakaClose': setState({ pustakaDetail: null, pustakaReading: false }); window.scrollTo(0, 0); break;
      case 'pustakaRead': setState({ pustakaReading: true, pustakaPage: 0 }); window.scrollTo(0, 0); break;
      case 'pustakaCloseRead': setState({ pustakaReading: false }); window.scrollTo(0, 0); break;
      case 'pustakaPrev': if (state.pustakaPage > 0) setState({ pustakaPage: state.pustakaPage - 1 }); window.scrollTo(0, 0); break;
      case 'pustakaNext': {
        var bk = pustaka.filter(function (b) { return b.id === state.pustakaDetail; })[0];
        if (bk && state.pustakaPage >= bk.isi.length - 1) setState({ pustakaReading: false });
        else setState({ pustakaPage: state.pustakaPage + 1 });
        window.scrollTo(0, 0); break;
      }
      case 'openArt': setState({ route: 'artikel', artikelDetail: +ds.id, menu: false }); window.scrollTo(0, 0); break;
      case 'artClose': setState({ artikelDetail: null }); break;
      case 'loadMore': setState({ artikelShown: state.artikelShown + 4 }); break;
      case 'submitLogin': {
        var a = accounts[state.loginEmail.trim().toLowerCase()];
        if (a && a.pass === state.loginPass) setState({ auth: a, loginError: '', loginPass: '' });
        else setState({ loginError: 'Email atau kata sandi tidak sesuai. Coba akun demo di bawah.' });
        break;
      }
      case 'logout': setState({ auth: null, loginEmail: '', loginPass: '', waliChild: 0 }); break;
      case 'pickChild': setState({ waliChild: +ds.i }); break;
      case 'cmsTab': setState({ cmsTab: ds.tab }); break;
      case 'addArtikel': setState({ extraArtikel: state.extraArtikel + 1 }); break;
      case 'submitAlumni':
        if (!state.alfNama.trim()) { setState({ alErr: 'Mohon isi nama lengkap Anda.' }); break; }
        if (!String(state.alfLulus).trim()) { setState({ alErr: 'Mohon isi tahun kelulusan Anda.' }); break; }
        setState({ alSent: true, alErr: '' }); break;
      case 'resetAlumni': setState({ alfNama: '', alfLulus: '', alfKegiatan: '', alfPesan: '', alSent: false, alErr: '' }); break;
      case 'kalKat': setState({ kalKat: ds.kat }); break;
      case 'submitPpdb':
        if (!state.ppNama.trim()) { setState({ ppErr: 'Mohon isi nama lengkap calon murid.' }); break; }
        if (!String(state.ppTgl).trim()) { setState({ ppErr: 'Mohon isi tanggal lahir calon murid.' }); break; }
        if (!state.ppOrtu.trim()) { setState({ ppErr: 'Mohon isi nama orang tua/wali.' }); break; }
        if (!state.ppHp.trim()) { setState({ ppErr: 'Mohon isi nomor WhatsApp yang bisa dihubungi.' }); break; }
        setState({ ppSent: true, ppErr: '' }); break;
      case 'resetPpdb': setState({ ppNama: '', ppTgl: '', ppOrtu: '', ppHp: '', ppAlamat: '', ppJalur: 'Zonasi', ppSent: false, ppErr: '' }); break;
      case 'adKind': setState({ adKind: ds.kind }); break;
      case 'toggleAnon': setState({ adAnon: !state.adAnon, adErr: '' }); break;
      case 'resetAduan': setState({ adKind: 'keluhan', adAnon: false, adName: '', adEmail: '', adHp: '', adMsg: '', adSent: false, adErr: '' }); break;
      case 'submitAduan':
        if (!state.adMsg.trim()) { setState({ adErr: 'Mohon tuliskan isi aduan atau saran Anda terlebih dahulu.' }); break; }
        if (!state.adAnon && !state.adName.trim()) { setState({ adErr: 'Mohon isi nama Anda, atau aktifkan mode anonim.' }); break; }
        setState({ adSent: true, adErr: '' }); window.scrollTo(0, 0); break;
    }
  }

  document.addEventListener('click', function (e) {
    var goEl = e.target.closest('[data-go]');
    if (goEl) { e.preventDefault(); go(goEl.getAttribute('data-go')); return; }
    var actEl = e.target.closest('[data-action]');
    if (actEl) { e.preventDefault(); actionHandler(actEl.getAttribute('data-action'), actEl.dataset); return; }
  });

  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.getAttribute('data-action') === 'artSearch') { setState({ artikelSearch: t.value, artikelShown: 4 }); return; }
    var model = t.getAttribute('data-model');
    if (model) setState(patchFor(model, t.value));
  });
  document.addEventListener('change', function (e) {
    var model = e.target.getAttribute('data-model');
    if (model && (model === 'karyaKelas' || model === 'karyaJenis' || model === 'pustakaKategori' || model === 'pustakaLevel' || model === 'alAngkatan' || model === 'ppJalur')) setState(patchFor(model, e.target.value));
  });
  function patchFor(model, val) { var p = {}; p[model] = val; return p; }

  // menu toggle
  document.getElementById('menutog').addEventListener('click', function () { setState({ menu: !state.menu }); });

  // ---- global effects: scroll transparency + custom cursor + swinger ----
  window.addEventListener('scroll', function () {
    var sc = window.scrollY > 24;
    if (sc !== state.scrolled) { state.scrolled = sc; document.getElementById('hdr').classList.toggle('scrolled', sc); }
  }, { passive: true });

  (function cursorAndToon() {
    var ring = document.querySelector('.cursor-ring'), dot = document.querySelector('.cursor-dot');
    var mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my, shown = false, t = 0, sr = 0;
    window.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (dot) dot.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px) translate(-50%,-50%)';
      if (!shown) { shown = true; if (ring) ring.style.opacity = '1'; if (dot) dot.style.opacity = '1'; }
      var hot = e.target && e.target.closest && e.target.closest('button,a,input,select,label,.kelas-card,.karya-card,.book-card,.child-card,.ann-item,.news-item,.chip,.tab,.brand,.cms-navb');
      if (ring) ring.style.width = ring.style.height = hot ? '56px' : '36px';
    }, { passive: true });
    function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      if (ring) ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      var sw = document.querySelector('.swinger');
      if (sw) {
        t += 0.02; var idle = Math.sin(t) * 9, flee = 0, r = sw.getBoundingClientRect();
        if (r.width) {
          var ax = r.left + r.width * 0.5, fy = r.top + r.height * 0.55, dx = mx - ax, dy = my - fy, d = Math.hypot(dx, dy);
          if (d < 230) { var pw = (230 - d) / 230; flee = -Math.sign(dx || 1) * pw * 46; }
        }
        sr += ((idle + flee) - sr) * 0.15; sw.style.transform = 'rotate(' + sr + 'deg)';
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  })();

  // ---- boot ----
  render();
})();
