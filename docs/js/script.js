/* 資料表ID設定 */
const SPREADSHEET_ID = '1UODq_-9CpStJIvjH7eGNQzTiaU5TGZQCom-7rfYH5AY';
const TELECOM_SPREADSHEET_ID = '1sXhvrTFYs7CLJtXAnoD_VFQE6v9e_MpKjOE2vxyX6fU';

/* 電信業者工作表對應關係 */
const TELECOM_SHEETS = {
    'cht': ['中華電信-4G', '中華電信-5G'],
    'twm': ['台哥大-4G', '台哥大-5G'],
    'fet': ['遠傳-4G', '遠傳-5G']
};

/* 預設方案類型 */
let currentPlanType = '4G';

/* 品牌工作表對應關係 */
const BRAND_SHEETS = {
    'APPLE': ['價格表-APPLE', '價格表-APPLE平板', '價格表-APPLE穿戴裝置'],
    'SAMSUNG': ['價格表-SAMSUNG', '價格表-SAMSUNG平板'],
    'OPPO': ['價格表-OPPO'],
    'ASUS': ['價格表-ASUS'],
    'vivo': ['價格表-vivo'],
    '小米': ['價格表-小米'],
    'Google': ['價格表-Google'],
    'SONY': ['價格表-SONY'],
    'realme': ['價格表-realme'],
    'Motorola': ['價格表-Motorola'],
    'HTC': ['價格表-HTC'],
    'Nokia': ['價格表-Nokia'],
    'G-PLUS': ['價格表-G-PLUS'],
    '福利品': ['價格表-福利品']
};

/* Tab 切換功能 */
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`[onclick="showTab('${tabId}')"]`).classList.add('active');
}

/* 初始化 Google Sheets 資料 */
function initGoogleSheets() {
    loadGoogleSheets('APPLE');
    document.querySelector('.brand-selector').value = 'APPLE';
}

/* 根據品牌篩選價格表 */
async function filterByBrand(brand) {
    await loadGoogleSheets(brand);
}

/* 載入價格表資料 */
async function loadGoogleSheets(brand) {
    const container = document.getElementById('google-sheets-container');
    const sheetNames = BRAND_SHEETS[brand];
    const API_KEY = 'AIzaSyBfTMUZUOoVWl9YE38t72tjHAGiBWmICT0';

    container.innerHTML = '<div class="loading">載入中...</div>';

    try {
        let allTablesHTML = '';
        let tabsHTML = '<div class="table-tabs">';

        // 建立選項卡按鈕
        sheetNames.forEach((sheetName, index) => {
            const tabName = index === 0 ? '手機價格' : (index === 1 ? '平板價格' : '穿戴裝置價格');
            const activeClass = index === 0 ? ' active' : '';
            tabsHTML += `<button class="table-tab${activeClass}" onclick="switchTable(${index})">${tabName}</button>`;
        });
        tabsHTML += '</div>';

        // 載入每個工作表的資料
        for (const sheetName of sheetNames) {
            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}?key=${API_KEY}`
            );
            const jsonData = await response.json();
            if (!jsonData.values) continue;
            
            const [headers, ...rows] = jsonData.values;

            // 建立價格表HTML
            const activeClass = sheetNames.indexOf(sheetName) === 0 ? ' active' : '';
            let tableHTML = `<div class="table-content${activeClass}">`;
            tableHTML += '<table class="price-table"><thead><tr>';

            headers.forEach(header => {
                tableHTML += `<th>${header || ''}</th>`;
            });

            tableHTML += '</tr></thead><tbody>';

            // 填充表格資料
            rows.forEach(row => {
                tableHTML += '<tr>';
                row.forEach((cell, index) => {
                    const value = cell || '';
                    const isPrice = index === 1 || index === 2;
                    let formattedValue = value;
                    if (isPrice && value) {
                        const numValue = Number(value);
                        formattedValue = !isNaN(numValue) ? '$' + numValue.toLocaleString('en-US') : value;
                    }
                    tableHTML += `<td>${formattedValue}</td>`;
                });
                tableHTML += '</tr>';
            });

            tableHTML += '</tbody></table></div>';
            allTablesHTML += tableHTML;
        }

        container.innerHTML = tabsHTML + allTablesHTML;

    } catch (error) {
        console.error('Error loading data:', error);
        container.innerHTML = '<div class="error-message">無法載入資料，請稍後再試。</div>';
    }
}

/* 切換表格顯示 */
function switchTable(index) {
    document.querySelectorAll('.table-tab').forEach((tab, i) => {
        tab.classList.toggle('active', i === index);
    });

    document.querySelectorAll('.table-content').forEach((content, i) => {
        content.classList.toggle('active', i === index);
    });
}

/* 顯示4G/5G方案按鈕 */
function showPlanButtons(carrier) {
    document.querySelectorAll('.telecom-link').forEach(link => {
        if (link.getAttribute('data-carrier') === carrier) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    document.querySelector('.plan-type-buttons').style.display = 'flex';
    loadTelecomSheets(carrier);
    showCurrentCarrier(carrier);
}

/* 切換方案類型(4G/5G) */
function switchPlanType(planType) {
    currentPlanType = planType;
    document.querySelectorAll('.plan-type-button').forEach(button => {
        button.classList.toggle('active', button.textContent.includes(planType));
    });

    const activeCarrier = document.querySelector('.telecom-link.active');
    if (activeCarrier) {
        const carrier = activeCarrier.getAttribute('data-carrier');
        loadTelecomSheets(carrier);
        showCurrentCarrier(carrier);
    }
}

/* 載入電信資費表 */
async function loadTelecomSheets(carrier) {
    if (!TELECOM_SPREADSHEET_ID) {
        console.error('資費內容請洽門市人員');
        return;
    }

    const container = document.getElementById('telecom-sheets-container');
    const sheetName = TELECOM_SHEETS[carrier][currentPlanType === '5G' ? 1 : 0];
    const API_KEY = 'AIzaSyBfTMUZUOoVWl9YE38t72tjHAGiBWmICT0';

    container.innerHTML = '<div class="loading">載入中...</div>';

    try {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${TELECOM_SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}?key=${API_KEY}`
        );
        const jsonData = await response.json();

        if (!jsonData.values) {
            container.innerHTML = '<div class="error-message">無法載入資料，請稍後再試。</div>';
            return;
        }

        const [headers, ...rows] = jsonData.values;

        let tableHTML = '<table class="price-table"><thead><tr>';
        headers.forEach(header => {
            tableHTML += `<th>${header || ''}</th>`;
        });
        tableHTML += '</tr></thead><tbody>';

        rows.forEach(row => {
            tableHTML += '<tr>';
            row.forEach(cell => {
                tableHTML += `<td>${cell || ''}</td>`;
            });
            tableHTML += '</tr>';
        });

        tableHTML += '</tbody></table>';
        container.innerHTML = tableHTML;

    } catch (error) {
        console.error('Error loading telecom data:', error);
        container.innerHTML = '<div class="error-message">無法載入資料，請稍後再試。</div>';
    }
}

/* 顯示當前電信業者 */
function showCurrentCarrier(carrier) {
    const carrierNames = {
        'cht': '中華電信',
        'twm': '台灣大哥大',
        'fet': '遠傳電信'
    };
    document.getElementById('current-carrier-display').textContent = `目前顯示：${carrierNames[carrier]} ${currentPlanType}方案`;
}

/* 圖片輪播功能 */
let currentSlide = 0;
const slides = document.querySelectorAll('.slider-container img');
const totalSlides = slides.length;

function slideImages(direction) {
    currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
    document.querySelector('.slider-container').style.transform = `translateX(-${currentSlide * 100}%)`;
}

/* 頁面載入完成後初始化 */
document.addEventListener('DOMContentLoaded', initGoogleSheets);