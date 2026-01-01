function getToken() {
  return localStorage.getItem("token");
}

export async function apiGet(path) {
  const token = getToken();
  const res = await fetch(path, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) throw new Error(data?.error || res.statusText);
  return data;
}

export async function apiPut(path, body) {
  const token = getToken();
  const res = await fetch(path, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) throw new Error(data?.error || res.statusText);
  return data;
}
