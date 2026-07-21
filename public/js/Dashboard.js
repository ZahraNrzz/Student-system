const main = document.getElementById('mainContent');

function loadProfileForm() {
  fetch('/Profile')
    .then(res => res.text())
    .then(html => {
      main.innerHTML = html;

      fetch('/api/profile/GetProfile', {
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
        document.getElementById("updateProfileForm").addEventListener("submit", function (event) {
          event.preventDefault();
          const formData = new FormData(this);
          const currentUsername = localStorage.getItem('currentUsername');
          formData.append('currentUsername', currentUsername);

          fetch('/api/profile/UpdateProfile', {
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

      const currentBalanceSpan = document.getElementById('current-balance');
      const reservationList = document.getElementById('reservationList');
      const foodListDiv = document.getElementById('food-list');
      const restaurantSelect = document.getElementById('restaurant');
      const foodForm = document.getElementById('foodReservationForm');
      const increaseButton = document.getElementById('increase-balance');

      // Get Food Reservation
      fetch('/api/reservation/GetReservations', { method: 'GET', credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          currentBalanceSpan.textContent = Number(data.balance).toLocaleString();

          reservationList.innerHTML = '';
          data.reservations.forEach(r => {
            reservationList.innerHTML += `
              <tr>
                <td>${r.date}</td>
                <td>${r.food.name} (${r.food.price.toLocaleString()} تومان)</td>
                <td>${r.restaurant}</td>
                <td>
                  <button class="cancel-btn" data-id="${r._id}">❌ لغو</button>
                  <button class="edit-btn" data-id="${r._id}" data-date="${r.date}" data-restaurant="${r.restaurant}" data-food='${JSON.stringify(r.food)}'>✏️ ویرایش</button>
                </td>
              </tr>
            `;
          });

          // Cancel Reservation
          document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const id = btn.dataset.id;
              if (!confirm('آیا از لغو این رزرو مطمئن هستید؟')) return;
              fetch(`/api/reservation/cancel-reservation/${id}`, { method: 'DELETE', credentials: 'include' })
                .then(res => res.json())
                .then(result => {
                  alert(result.message || 'رزرو با موفقیت لغو شد');
                  loadFoodReservation();
                })
                .catch(err => console.error(err));
            });
          });

          // Edit Reservation
          document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const id = btn.dataset.id;
              const date = btn.dataset.date;
              const restaurant = btn.dataset.restaurant;
              const food = JSON.parse(btn.dataset.food);

              document.querySelector('input[name="date"]').value = date;
              restaurantSelect.value = restaurant;

              loadFoods(restaurant).then(() => {
                const radio = document.querySelector(`input[name="food"][value='${JSON.stringify(food)}']`);
                if (radio) radio.checked = true;
              });

              foodForm.querySelector('#foodReservationSubmit').style.display = 'none';

              let editBtn = document.getElementById('editReservationSubmit');
              if (!editBtn) {
                editBtn = document.createElement('button');
                editBtn.id = 'editReservationSubmit';
                editBtn.type = 'button';
                editBtn.textContent = '✏️ ثبت ویرایش';
                foodForm.appendChild(editBtn);
              } else {
                editBtn.style.display = 'inline-block';
              }

              editBtn.onclick = () => {
                const formData = new FormData(foodForm);
                const newDate = formData.get('date');
                const newRestaurant = formData.get('restaurant');
                const newFood = JSON.parse(formData.get('food'));

                fetch(`/api/reservation/update-reservation/${id}`, {
                  method: 'PUT',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ date: newDate, restaurant: newRestaurant, food: newFood })
                })
                  .then(res => res.json())
                  .then(data => {
                    alert(data.message || 'ویرایش انجام شد');
                    loadFoodReservation();
                  });
              };
            });
          });
        });

      // Load Foods
      async function loadFoods(restaurant) {
        if (!restaurant) {
          foodListDiv.innerHTML = '';
          return;
        }

        try {
          const res = await fetch(`/api/reservation/GetFoods?restaurant=${encodeURIComponent(restaurant)}`);
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

      // Change Restorant
      restaurantSelect.addEventListener('change', () => {
        loadFoods(restaurantSelect.value);
      });

      // Reserve Food
      foodForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const formData = new FormData(foodForm);
        const date = formData.get('date');
        const restaurant = formData.get('restaurant');
        const food = JSON.parse(formData.get('food'));

        fetch('/api/reservation/ReserveFood', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, restaurant, food })
        })
          .then(res => res.json())
          .then(data => {
            alert(data.message || 'رزرو انجام شد');
            loadFoodReservation();
          });
      });

      // Increase Balance
      increaseButton.addEventListener('click', () => {
        const amount = prompt('مقدار افزایش موجودی (تومان):');
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
          alert('مقدار وارد شده معتبر نیست!');
          return;
        }

        fetch('/api/reservation/AddBalance', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount })
        })
          .then(res => res.json())
          .then(data => {
            alert(data.message || 'موجودی با موفقیت افزایش یافت');
            currentBalanceSpan.textContent = Number(data.balance).toLocaleString();
          })
          .catch(err => {
            console.error('خطا در افزایش موجودی:', err);
            alert('افزایش موجودی با خطا مواجه شد');
          });
      });
    });
}

function loadRequestsContent() {
  fetch('/Requests')
    .then(res => res.text())
    .then(html => {
      main.innerHTML = html;
      loadRequests();

      const form = document.getElementById('requestForm');
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const receiver = form.receiver.value;
        const message = form.message.value;

        fetch('/api/requests/SendRequest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ receiver, message })
        })
          .then(res => res.json())
          .then(data => {
            alert(data.message || 'درخواست ثبت شد');
            form.reset();
            loadRequests();
          })
          .catch(err => {
            console.error('خطا در ارسال درخواست:', err);
            alert('ارسال با خطا مواجه شد');
          });
      });
    });
}

async function loadRequests() {
  const res = await fetch('/api/requests/GetRequests');
  const requests = await res.json();

  const table = document.getElementById('requestTable');
  if (!table) return;

  const tbody = table.querySelector('tbody');
  tbody.innerHTML = '';

  requests.forEach(req => {
    const tr = document.createElement('tr');
    const cleanStatus = req.status.replace(/\s/g, '');

    tr.innerHTML = `
      <td>${req.receiver}</td>
      <td>${req.message}</td>
      <td class="status-${cleanStatus}">${req.status}</td>
      <td>${new Date(req.createdAt).toLocaleDateString('fa-IR')}</td>
    `;

    tbody.appendChild(tr);
  });
}

function loadFinanceContent() {
  fetch('/Payments')
    .then(res => res.text())
    .then(html => {
      main.innerHTML = html;

      const termInput = document.getElementById('term-select');
      const payButton = document.getElementById('pay-tuition-btn');
      const paymentAmount = document.getElementById('pay-amount');

      termInput.addEventListener('change', () => {
        loadTuitionStatus(termInput.value);
      });

      payButton.addEventListener('click', () => {
        const amount = Number(paymentAmount.value);
        const term = termInput.value;
        if (!term || amount <= 0) return alert('لطفا مقدار معتبر و ترم را وارد کنید');

        fetch('/api/payments/PayTuition', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, term })
        })
          .then(res => res.json())
          .then(data => {
            alert(data.message);
            loadTuitionStatus(term);
          });
      });

      loadTuitionStatus(termInput.value);
    });
}

function loadTuitionStatus(term) {
  fetch(`/api/payments/GetTuitionStatus?term=${term}`, {
    method: 'GET',
    credentials: 'include'
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById('total-paid').textContent = data.totalPaid.toLocaleString();
      document.getElementById('remaining').textContent = data.remaining.toLocaleString();

      const table = document.getElementById('payments-table-body');
      table.innerHTML = '';
      data.payments.forEach(p => {
        table.innerHTML += `
        <tr>
          <td>${new Date(p.date).toLocaleDateString('fa-IR')}</td>
          <td>${p.amount.toLocaleString()} تومان</td>
          <td>${p.term}</td>
          <td>${p.totalPaidUpToThisPayment.toLocaleString()} تومان</td>
          <td>${p.remaining.toLocaleString()} تومان</td>
        </tr>
      `;
      });
    });
}

function loadNotificationSection() {
  fetch('/Notifications')
    .then(res => res.text())
    .then(html => {
      main.innerHTML = html;
    })
}

function loadCourseList() {
  fetch('/CourseList')
    .then(res => res.text())
    .then(html => {
      main.innerHTML = html;

      fetch('/api/courses/GetCourses')
        .then(res => res.json())
        .then(courses => {
          const table = document.getElementById('course-table-body');
          table.innerHTML = '';
          courses.forEach(c => {
            table.innerHTML += `
              <tr>
                <td>${c.title}</td>
                <td>${c.code}</td>
                <td>${c.unit}</td>
              </tr>
            `;
          });
        });
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
        loadRequestsContent();
        break;
      case 'semester-courses':
        loadCourseList();
        break;
      case 'payments':
        loadFinanceContent();
        break;
      case 'messages':
        loadNotificationSection();
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
        loadRequestsContent();
        break;
      case 'semester-courses':
        loadCourseList();
        break;
      case 'payments':
        loadFinanceContent();
        break;
      case 'messages':
        loadNotificationSection();
        break;
    }
  }
});
