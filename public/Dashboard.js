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
      document.getElementById('current-balance').textContent = data.balance.toLocaleString();

        const reservationList = document.getElementById('reservationList');
        reservationList.innerHTML = '';
        data.reservations.forEach(r => {
          reservationList.innerHTML += `
            <tr>
              <td>${r.date}</td>
              <td>${r.food.name} (${r.food.price.toLocaleString()} تومان)</td>
              <td>${r.restaurant}</td>
              <td>
                <button class="cancel-btn" data-id="${r._id}">❌ لغو</button>
              </td>
            </tr>
          `;
        });

        setTimeout(() => {
          document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const id = btn.dataset.id;
              if (confirm('آیا از لغو این رزرو مطمئن هستید؟')) {
                fetch(`/cancel-reservation/${id}`, {
                  method: 'DELETE',
                  credentials: 'include'
                })
                .then(res => res.json())
                .then(result => {
                  alert(result.message || 'رزرو با موفقیت لغو شد');
                  loadFoodReservation(); 
                })
                .catch(err => console.error(err));
              }
            });
          });
        }, 100);
      });

      const restaurantSelect = document.getElementById('restaurant');
      const foodListDiv = document.getElementById('food-list');

      if (restaurantSelect.value) {
        loadFoods(restaurantSelect.value);
      }

      restaurantSelect.addEventListener('change', function () {
        const selectedRestaurant = this.value;
        loadFoods(selectedRestaurant);
      });

      async function loadFoods(restaurant) {
        if (!restaurant) {
          foodListDiv.innerHTML = '';
          return;
        }

        try {
          const res = await fetch(`/GetFoods?restaurant=${encodeURIComponent(restaurant)}`);
          const foods = await res.json();

          foodListDiv.innerHTML = foods.map(food => `
            <input type="radio" id="food-${food._id}" name="food" value='${JSON.stringify(food)}' required>
            <label for="food-${food._id}" class="custom-radio">
              <img src="/Images/${food.image}" alt="${food.name}" width="80" height="80">
              <div>
                <strong>${food.name}</strong><br>
                ${food.price.toLocaleString()} تومان
              </div>
            </label>
          `).join('');

        } catch (err) {
          console.error('خطا در واکشی غذاها:', err);
        }
      }

      setTimeout(() => {
        const increaseButton = document.getElementById('increase-balance');
        increaseButton.addEventListener('click', () => {
          const amount = prompt('مقدار افزایش موجودی (تومان):');
          if (!amount || isNaN(amount) || Number(amount) <= 0) {
            alert('مقدار وارد شده معتبر نیست!');
            return;
          }

          fetch('/RechargeBalance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ amount })
          })
          .then(res => res.json())
          .then(data => {
            alert(data.message || 'موجودی با موفقیت افزایش یافت');
            document.getElementById('current-balance').textContent = Number(data.balance).toLocaleString();
          })
          .catch(err => {
            console.error('خطا در افزایش موجودی:', err);
            alert('افزایش موجودی با خطا مواجه شد');
          });
        });
      }, 100);


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

    localStorage.setItem('activeTab', item.id);

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

window.addEventListener('DOMContentLoaded', () => {
    const username = localStorage.getItem('currentUsername');
    if (!username) {
    window.location.href = '/Login';
    return;
    }
      
    const activeTab = localStorage.getItem('activeTab') || 'profile';
    document.getElementById(activeTab)?.classList.add('active');

    const justLoggedIn = localStorage.getItem('justLoggedIn');

    if (justLoggedIn === 'true') {
      loadProfileForm();
      document.querySelectorAll('.dashboard-sidebar ul li').forEach(el => el.classList.remove('active'));
      document.getElementById('profile').classList.add('active');
      localStorage.removeItem('justLoggedIn');
      
    } else {

    switch (activeTab) {
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
    }
}
});