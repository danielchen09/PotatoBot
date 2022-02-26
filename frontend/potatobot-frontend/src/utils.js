export function get_params(params) {
    return Object.keys(params).map((key) => {
        return `${key}=${encodeURIComponent(params[key])}`
    }).join('&');
}

export async function get_backend(endpoint, params) {
    let res = await fetch(`${process.env.REACT_APP_BACKEND_URI}/${endpoint}?${get_params(params)}`);
    return await res.json();
}

export async function post_backend(endpoint, body) {
    console.log(body);
    await fetch(`${process.env.REACT_APP_BACKEND_URI}/${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify(body)
    });
}