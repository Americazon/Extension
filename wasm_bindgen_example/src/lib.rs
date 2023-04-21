use wasm_bindgen::prelude::*;
use web_sys::console;

#[wasm_bindgen]
#[no_mangle]
pub fn greet(name: &str) {
    console::log_1(&format!("Hello, {}!", name).into());
}