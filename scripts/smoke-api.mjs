const baseUrl = process.env.SMOKE_API_URL || 'http://127.0.0.1:3001';
const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const password = `SpLocal-${runId}-Aa1!`;

const users = [
  { email: `sp-test-user-1+${runId}@example.com`, name: 'SP Test User 1' },
  { email: `sp-test-user-2+${runId}@example.com`, name: 'SP Test User 2' },
];

function log(step) {
  console.log(`ok - ${step}`);
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      accept: 'application/json',
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let body = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${path} -> ${response.status}: ${text}`);
  }

  return body;
}

function authHeaders(user) {
  return { Authorization: `Bearer ${user.accessToken}` };
}

async function registerAndLogin(user) {
  await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: user.email,
      password,
      name: user.name,
    }),
  });

  const token = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: user.email,
      password,
    }),
  });

  user.accessToken = token.access_token;
  user.refreshToken = token.refresh_token;
}

async function run() {
  await request('/health');
  log('health');

  for (const user of users) {
    await registerAndLogin(user);
  }
  log('register and login for two users');

  const [user1, user2] = users;
  await request('/me', { headers: authHeaders(user1) });
  await request('/me/usage', { headers: authHeaders(user1) });
  await request('/recipes', { headers: authHeaders(user1) });
  log('profile, usage, and recipes read endpoints');

  const grocery = await request('/groceries', {
    method: 'POST',
    headers: authHeaders(user1),
    body: JSON.stringify({
      name: 'Smoke Test Apples',
      quantity: 3,
      unit: 'pcs',
      category: 'Fruit',
      low_stock_threshold: 1,
    }),
  });

  const user1Groceries = await request('/groceries', { headers: authHeaders(user1) });
  const user2Groceries = await request('/groceries', { headers: authHeaders(user2) });

  if (!user1Groceries.some((item) => item.id === grocery.id)) {
    throw new Error('User 1 cannot read the grocery created by User 1');
  }

  if (user2Groceries.some((item) => item.id === grocery.id)) {
    throw new Error('User 2 can see User 1 grocery');
  }

  await request(`/groceries/${grocery.id}`, {
    method: 'PUT',
    headers: authHeaders(user1),
    body: JSON.stringify({
      name: 'Smoke Test Apples Updated',
      quantity: 4,
      unit: 'pcs',
      category: 'Fruit',
      low_stock_threshold: 1,
    }),
  });

  await request(`/groceries/${grocery.id}`, {
    method: 'DELETE',
    headers: authHeaders(user1),
  });
  log('grocery create, read, isolation, update, and delete');

  const savedRecipe = await request('/recipes', {
    method: 'POST',
    headers: authHeaders(user1),
    body: JSON.stringify({
      recipeId: Number(String(Date.now()).slice(-9)),
      title: 'Smoke Test Recipe',
      image: null,
      usedIngredients: [{ name: 'Apples', amount: 3, unit: 'pcs' }],
      missedIngredients: [],
      sourceUrl: null,
      readyInMinutes: 10,
      servings: 1,
      instructions: 'Slice apples.',
      ingredientsJson: { ingredients: ['Apples'] },
    }),
  });

  const user1Recipes = await request('/recipes', { headers: authHeaders(user1) });
  const user2Recipes = await request('/recipes', { headers: authHeaders(user2) });

  if (!user1Recipes.some((recipe) => recipe.id === savedRecipe.id)) {
    throw new Error('User 1 cannot read the recipe created by User 1');
  }

  if (user2Recipes.some((recipe) => recipe.id === savedRecipe.id)) {
    throw new Error('User 2 can see User 1 recipe');
  }

  await request(`/recipes/${savedRecipe.id}`, {
    method: 'DELETE',
    headers: authHeaders(user1),
  });
  log('saved recipe create, read, isolation, and delete');

  const shoppingList = await request('/shopping-lists/', {
    method: 'POST',
    headers: authHeaders(user1),
    body: JSON.stringify({
      name: 'Smoke Test List',
      items: [],
    }),
  });

  const shoppingItem = await request(`/shopping-lists/${shoppingList.id}/items`, {
    method: 'POST',
    headers: authHeaders(user1),
    body: JSON.stringify({
      name: 'Milk',
      quantity: 1,
      unit: 'l',
      checked: false,
    }),
  });

  await request(`/shopping-lists/${shoppingList.id}/items/${shoppingItem.id}/toggle`, {
    method: 'PUT',
    headers: authHeaders(user1),
  });

  const user2Lists = await request('/shopping-lists', { headers: authHeaders(user2) });

  if (user2Lists.some((list) => list.id === shoppingList.id)) {
    throw new Error('User 2 can see User 1 shopping list');
  }

  await request(`/shopping-lists/${shoppingList.id}`, {
    method: 'DELETE',
    headers: authHeaders(user1),
  });
  log('shopping list create, item add, toggle, isolation, and delete');

  for (const user of users) {
    await request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: user.refreshToken }),
    });
  }
  log('logout');

  console.log(`Smoke test users created: ${users.map((user) => user.email).join(', ')}`);
}

run().catch((error) => {
  console.error(`Smoke API failed: ${error.message}`);
  process.exit(1);
});
