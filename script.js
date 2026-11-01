// GANTI URL DI BAWAH INI DENGAN URL WEB APP GOOGLE APPS SCRIPT DB_WAFA ANDA!
const scriptURL = 'https://script.google.com/macros/s/AKfycbx49XrGWi1ifQe-vT6o4zR6-1AeQfxjPvdXY5TvGs43rJ0PCrwet4oWZQsxZpBjYs8E/execc'; 

const form = document.getElementById('attendanceForm');
const pengampuSelect = document.getElementById('pengampu');
const studentContainer = document.getElementById('studentListContainer');
const submitBtn = document.getElementById('submitBtn');
let databaseSiswa = {}; // Untuk menyimpan data pengampu & guru dari Google Sheets

// 1. Set Tanggal Hari Ini Default
document.getElementById('tanggal').valueAsDate = new Date();

// 2. Fetch Data dari Google Sheets saat halaman dimuat
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch(scriptURL);
        databaseSiswa = await response.json();
        
        // Populate Dropdown Pengampu
        pengampuSelect.innerHTML = '<option value="" disabled selected>-- Pilih Pengampu --</option>';
        for (let pengampu in databaseSiswa) {
            let option = document.createElement('option');
            option.value = pengampu;
            option.textContent = pengampu;
            pengampuSelect.appendChild(option);
        }
    } catch (error) {
        console.error('Gagal memuat data:', error);
        pengampuSelect.innerHTML = '<option value="" disabled>Gagal memuat data. Periksa koneksi.</option>';
    }
});

// 3. Render Daftar Peserta saat Pengampu dipilih (Default status: Hadir / H)
pengampuSelect.addEventListener('change', function() {
    const selectedPengampu = this.value;
    const pesertaList = databaseSiswa[selectedPengampu] || [];
    
    studentContainer.innerHTML = ''; // Kosongkan konteks sebelumnya
    
    if (pesertaList.length > 0) {
        studentContainer.style.display = 'block';
        pesertaList.forEach((peserta, index) => {
            const itemHTML = `
                <div class="student-item">
                    <div class="student-name">${peserta}</div>
                    <div class="attendance-options">
                        <label class="radio-option">
                            <input type="radio" name="status_${index}" value="H" checked required>
                            <div class="radio-label">H</div>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="status_${index}" value="S">
                            <div class="radio-label">S</div>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="status_${index}" value="I">
                            <div class="radio-label">I</div>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="status_${index}" value="A">
                            <div class="radio-label">A</div>
                        </label>
                    </div>
                </div>
            `;
            studentContainer.insertAdjacentHTML('beforeend', itemHTML);
        });
    } else {
        studentContainer.style.display = 'none';
    }
});

// 4. Handle Submit Form
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const selectedPengampu = pengampuSelect.value;
    if (!selectedPengampu || !databaseSiswa[selectedPengampu]) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

    const pesertaList = databaseSiswa[selectedPengampu];
    let dataPeserta = [];
    
    pesertaList.forEach((peserta, index) => {
        const statusElement = document.querySelector(`input[name="status_${index}"]:checked`);
        dataPeserta.push({
            nama: peserta,
            status: statusElement ? statusElement.value : 'H'
        });
    });

    const payload = {
        action: 'simpanJurnal',
        tanggal: document.getElementById('tanggal').value,
        pengampu: selectedPengampu,
        catatan: document.getElementById('catatan').value,
        peserta: dataPeserta
    };

    try {
        const response = await fetch(scriptURL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });

        const result = await response.json();
        
        if (result.status === 'success') {
            Swal.fire({
                title: 'Berhasil!',
                text: 'Alhamdulillah data presensi sudah tersimpan',
                icon: 'success',
                confirmButtonColor: '#0284c7',
                confirmButtonText: 'Oke'
            }).then(() => {
                form.reset();
                studentContainer.style.display = 'none';
                document.getElementById('tanggal').valueAsDate = new Date();
            });
        } else {
            throw new Error(result.message || "Terjadi kesalahan di server");
        }
    } catch (error) {
        console.error('Error!', error.message);
        Swal.fire({
            title: 'Gagal!',
            text: 'Data gagal disimpan, periksa koneksi internet Anda.',
            icon: 'error',
            confirmButtonColor: '#ef4444'
        });
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Kirim Data';
    }
});
