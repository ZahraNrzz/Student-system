const main = document.getElementById('mainContent');

document.querySelectorAll('.dashboard-sidebar ul li').forEach(item => {
    item.addEventListener('click', () => {
    document.querySelectorAll('.dashboard-sidebar ul li').forEach(el => el.classList.remove('active'));
    item.classList.add('active');
    });
});



function loadProfileForm() {
    fetch('/Profile') 
    .then(res => res.text())
    .then(html => {
        main.innerHTML = html;

        fetch('/GetProfile', {
        method: 'GET',
        credentials: 'include'
        })
        .then(res => res.json())
        .then(data => {
        if (data.username) document.getElementById('username').value = data.username;
        if (data.email) document.getElementById('email').value = data.email;
        if (data.password) document.getElementById('password').value = data.password;
        if (data.avatarBase64) {
            document.getElementById('profile-avatar').src = `data:image/jpeg;base64,${data.avatarBase64}`;
        }
        });

        setTimeout(() => {
        document.getElementById("updateProfileForm").addEventListener("submit", function(event) {
            event.preventDefault();
            const formData = new FormData(this);
            const currentUsername = localStorage.getItem('currentUsername');
            formData.append('currentUsername', currentUsername);

            fetch('/UpdateProfile', {
            method: 'POST',
            body: formData
            })
            .then(response => response.json())
            .then(data => {
            alert(data.message || 'پروفایل با موفقیت به‌روزرسانی شد');
            setTimeout(() => location.reload(), 500);
            })
            .catch(error => {
            console.error('خطا در ارسال فرم:', error);
            window.location.href = '/Login';
            });
        });
        }, 100);
    });
}

function loadFoodReservation() {
  fetch('/FoodReservation') 
    .then(res => res.text())
    .then(html => {
      main.innerHTML = html;

      fetch('/GetReservations', {
        method: 'GET',
        credentials: 'include'
      })
      .then(res => res.json())
      .then(data => {
        document.getElementById('balance').textContent = data.balance.toLocaleString();

        const reservationList = document.getElementById('reservationList');
        reservationList.innerHTML = '';
        data.reservations.forEach(r => {
          reservationList.innerHTML += `<li>${r.date} | ${r.food.name} (${r.food.price.toLocaleString()} تومان) - ${r.restaurant}</li>`;
        });
      });

      setTimeout(() => {
        document.getElementById('foodReservationForm').addEventListener('submit', function(event) {
          event.preventDefault();
          const formData = new FormData(this);
          const date = formData.get('date');
          const restaurant = formData.get('restaurant');
          const food = JSON.parse(formData.get('food'));

          fetch('/ReserveFood', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, food, restaurant })
          })
          .then(res => res.json())
          .then(data => {
            alert(data.message || 'رزرو انجام شد');
            loadFoodReservation(); 
          });
        });
      }, 100);
    });
}


function loadContent(title, content) {
    main.innerHTML = `<h1>${title}</h1><p>${content}</p>`;
}

document.querySelectorAll('.dashboard-sidebar ul li').forEach(item => {
    item.addEventListener('click', () => {
    document.querySelectorAll('.dashboard-sidebar ul li').forEach(el => el.classList.remove('active'));
    item.classList.add('active');

    switch (item.id) {
        case 'profile':
        loadProfileForm();
        break;
        case 'food-reservation':
        loadFoodReservation();
        break;
        case 'requests':
        loadContent('📄 درخواست‌ها', 'به زودی');
        break;
        case 'semester-courses':
        loadContent('📚 دروس نیمسال', 'به زودی');
        break;
        case 'payments':
        loadContent('💰 پرداخت‌ها و امور مالی', 'به زودی');
        break;
        case 'messages':
        loadContent('📨 پیام‌ها و اطلاعیه‌ها', 'به زودی');
        break;
        case 'logout':
        localStorage.removeItem('currentUsername');
        window.location.href = '/';
        break;
    }
    });
});

fetch('/GetFoods')
  .then(res => res.json())
  .then(foods => {
    const foodList = document.getElementById('food-list');
    foodList.innerHTML = '';
    foods.forEach(food => {
      const div = document.createElement('div');
      div.className = 'food-item';
      div.innerHTML = `
        <input type="radio" name="food" value='${JSON.stringify(food)}' required>
        <img src="/uploads/${food.image}" alt="${food.name}" />
        <span>${food.name} - ${food.price} تومان</span>
      `;
      foodList.appendChild(div);
    });
  });


window.addEventListener('DOMContentLoaded', () => {
    const username = localStorage.getItem('currentUsername');
    if (!username) {
    window.location.href = '/Login';
    return;
    }
    loadProfileForm();
});