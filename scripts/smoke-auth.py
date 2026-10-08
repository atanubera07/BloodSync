import http.cookiejar, json, urllib.request, urllib.error, re, time, secrets
api='http://localhost:4000'
mail='http://localhost:8025'
email='smoke-'+secrets.token_hex(4)+'@example.test'
password='smoke-passphrase-2026'
jar=http.cookiejar.CookieJar(); opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
def post(path, data):
 headers={'Content-Type':'application/json','Origin':'http://localhost:3000'}
 csrf=next((cookie.value for cookie in jar if cookie.name=='bs_csrf'),None)
 if csrf: headers['X-CSRF-Token']=csrf
 req=urllib.request.Request(api+path,data=json.dumps(data).encode(),headers=headers)
 try:
  with opener.open(req) as r:return r.status,json.load(r)
 except urllib.error.HTTPError as e:return e.code,json.load(e)
def get(path):
 try:
  with opener.open(api+path) as r:return r.status,json.load(r)
 except urllib.error.HTTPError as e:return e.code,json.load(e)
def token_for(subject):
 for _ in range(20):
  with urllib.request.urlopen(mail+'/api/v1/messages') as r: listing=json.load(r)
  for item in listing.get('messages',[]):
   if email in item.get('To',[{}])[0].get('Address','') and item.get('Subject')==subject:
    with urllib.request.urlopen(mail+'/api/v1/message/'+item['ID']) as r:message=json.load(r)
    match=re.search(r'token=([A-Za-z0-9_-]{43})',message['Text'])
    if match:return match.group(1)
  time.sleep(.25)
 raise RuntimeError('Email not found: '+subject)
assert get('/auth/me')[0]==401
assert post('/auth/register',{'email':email,'password':password,'fullName':'Smoke Tester'})[0]==201
assert post('/auth/login',{'email':email,'password':password})[0]==401
verify=token_for('Verify your BloodSync email')
assert post('/auth/verify-email',{'token':verify})[0]==200
assert post('/auth/verify-email',{'token':verify})[0]==400
assert post('/auth/login',{'email':email,'password':password})[0]==200
old_refresh=next(cookie.value for cookie in jar if cookie.name=='bs_refresh')
assert post('/auth/refresh',{})[0]==200
new_refresh=next(cookie.value for cookie in jar if cookie.name=='bs_refresh')
assert old_refresh!=new_refresh
old_csrf=next(cookie.value for cookie in jar if cookie.name=='bs_csrf')
old_request=urllib.request.Request(api+'/auth/refresh',data=b'{}',headers={'Content-Type':'application/json','Origin':'http://localhost:3000','X-CSRF-Token':old_csrf,'Cookie':'bs_refresh='+old_refresh+'; bs_csrf='+old_csrf},method='POST')
try:
 urllib.request.urlopen(old_request)
 raise AssertionError('Old refresh token was accepted')
except urllib.error.HTTPError as error:
 assert error.code==401
assert get('/auth/me')[0]==200
assert post('/auth/password/forgot',{'email':email})[0]==200
reset=token_for('Reset your BloodSync password')
assert post('/auth/password/reset',{'token':reset,'password':'new-smoke-passphrase-2026'})[0]==200
assert get('/auth/me')[0]==401
assert post('/auth/login',{'email':email,'password':password})[0]==401
assert post('/auth/login',{'email':email,'password':'new-smoke-passphrase-2026'})[0]==200
csrf_request=urllib.request.Request(api+'/auth/logout',data=b'{}',headers={'Content-Type':'application/json'},method='POST')
try:
 opener.open(csrf_request)
 raise AssertionError('Cookie mutation without Origin was accepted')
except urllib.error.HTTPError as error:
 assert error.code==400
assert post('/auth/logout',{})[0]==200
assert get('/auth/me')[0]==401
for _ in range(5):
 result=post('/auth/login',{'email':email,'password':'incorrect-password'})
 assert result[0]==401, result
assert post('/auth/login',{'email':email,'password':'new-smoke-passphrase-2026'})[0]==429
print('PASS: registration, verification, refresh rotation/reuse, CSRF, password reset, logout, account lockout')
