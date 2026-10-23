/* Prototyp bez serwera: baza pyta /api/… (asystent AI, głos, „znak”, brakujące tłumaczenia). Na zarobkilekarzy.pl
   tych adresów nie ma, więc zapytania kończą się tu błędem sieci, zanim cokolwiek wyjdzie z przeglądarki —
   baza łapie go i zostaje w trybie skryptowym (jak na mobywatel.ai bez asystenta). Ładowany jako pierwszy skrypt. */
(function(){
 const fetch0=window.fetch.bind(window);
 const doSerwera=u=>{try{return new URL(typeof u==='string'?u:u.url,location.href).pathname.startsWith('/api/')}catch(e){return false}};
 window.fetch=(u,o)=>doSerwera(u)?Promise.reject(new TypeError('prototyp bez serwera')):fetch0(u,o);
})();
