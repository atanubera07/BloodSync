"""Local PostGIS/Mailpit API test; requires a running API and the development env."""
import datetime
import http.cookiejar
import json
import os
import re
import secrets
import subprocess
import time
import urllib.error
import urllib.request

API = 'http://localhost:4000'
MAIL = 'http://localhost:8025'
PASSWORD = 'phase-two-password-2026'
SUFFIX = secrets.token_hex(4)

class Client:
    def __init__(self):
        self.jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def call(self, method, path, body=None, origin='http://localhost:3000'):
        headers = {} if origin is None else {'Origin': origin}
        csrf = next((cookie.value for cookie in self.jar if cookie.name == 'bs_csrf'), None)
        if csrf and method not in ('GET', 'HEAD'):
            headers['X-CSRF-Token'] = csrf
        if body is not None:
            headers['Content-Type'] = 'application/json'
        request = urllib.request.Request(API + path, data=json.dumps(body).encode() if body is not None else None, headers=headers, method=method)
        try:
            with self.opener.open(request) as response:
                return response.status, json.load(response)
        except urllib.error.HTTPError as error:
            return error.code, json.load(error)

def mail_token(email, subject):
    for _ in range(30):
        with urllib.request.urlopen(MAIL + '/api/v1/messages') as response:
            messages = json.load(response).get('messages', [])
        for item in messages:
            if item.get('Subject') != subject or email not in item.get('To', [{}])[0].get('Address', ''):
                continue
            with urllib.request.urlopen(MAIL + '/api/v1/message/' + item['ID']) as response:
                message = json.load(response)
            match = re.search(r'token=([A-Za-z0-9_-]{43})', message['Text'])
            if match:
                return match.group(1)
        time.sleep(.2)
    raise RuntimeError('Verification email not received')

def account(label):
    client = Client()
    email = f'phase2-{label}-{SUFFIX}@example.test'
    assert client.call('POST', '/auth/register', {'email': email, 'fullName': label.title() + ' Tester', 'password': PASSWORD})[0] == 201
    token = mail_token(email, 'Verify your BloodSync email')
    assert client.call('POST', '/auth/verify-email', {'token': token})[0] == 200
    check(client, 'POST', '/auth/login', 200, {'email': email, 'password': PASSWORD})
    return client, email

def check(client, method, path, expected, body=None):
    actual, data = client.call(method, path, body)
    assert actual == expected, f'{method} {path}: expected {expected}, got {actual}: {data}'
    return data

admin, admin_email = account('admin')
subprocess.run(['node', 'apps/api/dist/apps/api/src/provision-admin.js', admin_email], check=True, env=os.environ, stdout=subprocess.DEVNULL)
# Existing access token carries a session ID; the guard reads the current database role.
patient, patient_email = account('patient')
other_patient, _ = account('otherpatient')
donor, donor_email = account('donor')
other_donor, _ = account('otherdonor')
anonymous = Client()

profile = {'bloodGroup': 'O-', 'birthDate': '1998-03-01', 'weightKg': 55, 'lastDonationAt': None, 'city': 'Kolkata', 'latitude': 22.5726, 'longitude': 88.3639, 'consentToMatch': True}
request = {'bloodGroup': 'A+', 'units': 2, 'urgency': 'URGENT', 'hospitalName': 'City Hospital', 'city': 'Kolkata', 'latitude': 22.5730, 'longitude': 88.3640, 'expiresAt': (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=2)).isoformat().replace('+00:00','Z')}

# Each protected route rejects logged-out traffic.
for method, path, body in [
    ('GET','/donors/me',None),('PUT','/donors/me',profile),('GET','/donors/me/matches',None),('POST','/donors/me/interests/550e8400-e29b-41d4-a716-446655440000',None),
    ('GET','/requests',None),('POST','/requests',request),('GET','/requests/550e8400-e29b-41d4-a716-446655440000',None),('PATCH','/requests/550e8400-e29b-41d4-a716-446655440000',{'city':'Delhi'}),('DELETE','/requests/550e8400-e29b-41d4-a716-446655440000',None),
    ('GET','/requests/550e8400-e29b-41d4-a716-446655440000/matches',None),('GET','/requests/550e8400-e29b-41d4-a716-446655440000/interests',None),
    ('GET','/me/consent',None),('POST','/me/consent',{'privacyVersion':'2026-10-08','healthProcessing':True,'contactSharing':True}),('DELETE','/me/consent',None),('GET','/me/export',None),('DELETE','/me',{'password':PASSWORD}),
    ('GET','/admin/donors',None),('POST','/admin/donors/550e8400-e29b-41d4-a716-446655440000/approve',None),('POST','/admin/donors/550e8400-e29b-41d4-a716-446655440000/reject',None),('GET','/admin/audit',None),
]:
    check(anonymous, method, path, 401, body)

# Admin actions reject ordinary accounts, and ordinary routes reject admin accounts.
for method,path in [('GET','/admin/donors'),('POST','/admin/donors/550e8400-e29b-41d4-a716-446655440000/approve'),('POST','/admin/donors/550e8400-e29b-41d4-a716-446655440000/reject'),('GET','/admin/audit')]:
    check(patient,method,path,403)
for method,path,body in [('GET','/donors/me',None),('PUT','/donors/me',profile),('GET','/donors/me/matches',None),('POST','/donors/me/interests/550e8400-e29b-41d4-a716-446655440000',None),('GET','/requests',None),('POST','/requests',request),('GET','/requests/550e8400-e29b-41d4-a716-446655440000',None),('PATCH','/requests/550e8400-e29b-41d4-a716-446655440000',{'city':'Delhi'}),('DELETE','/requests/550e8400-e29b-41d4-a716-446655440000',None),('GET','/requests/550e8400-e29b-41d4-a716-446655440000/matches',None),('GET','/requests/550e8400-e29b-41d4-a716-446655440000/interests',None)]:
    check(admin,method,path,403,body)

# Donor identity comes from the session; a client-supplied userId is rejected.
check(donor,'POST','/me/consent',200,{'privacyVersion':'2026-10-08','healthProcessing':True,'contactSharing':True})
check(other_donor,'POST','/me/consent',200,{'privacyVersion':'2026-10-08','healthProcessing':True,'contactSharing':True})
check(donor,'PUT','/donors/me',400,{**profile,'userId':patient_email})
donor_profile=check(donor,'PUT','/donors/me',200,profile)
check(donor,'GET','/donors/me',200)
check(donor,'GET','/donors/me/matches',403)
second_profile=check(other_donor,'PUT','/donors/me',200,{**profile,'bloodGroup':'B+'})
queue=check(admin,'GET','/admin/donors',200)
assert {donor_profile['id'],second_profile['id']}.issubset({item['id'] for item in queue})
check(admin,'POST',f"/admin/donors/{donor_profile['id']}/approve",200)
check(admin,'POST',f"/admin/donors/{second_profile['id']}/reject",200)
check(admin,'GET','/admin/audit',200)
check(other_donor,'GET','/donors/me/matches',403)
check(admin,'POST',f"/admin/donors/{donor_profile['id']}/approve",409)

# Request list and every detail/action route are owner scoped.
check(patient,'POST','/requests',400,{**request,'ownerId':'550e8400-e29b-41d4-a716-446655440000'})
created=check(patient,'POST','/requests',201,request)
request_id=created['id']
assert patient.call('PATCH',f'/requests/{request_id}',{'units':5},origin=None)[0]==400
assert patient.call('PATCH',f'/requests/{request_id}',{'units':5},origin='https://attacker.example')[0]==400
assert [item['id'] for item in check(patient,'GET','/requests',200)] == [request_id]
assert check(other_patient,'GET','/requests',200) == []
for method,suffix,body in [('GET','',None),('PATCH','',{'city':'Delhi'}),('DELETE','',None),('GET','/matches',None),('GET','/interests',None)]:
    check(other_patient,method,f'/requests/{request_id}{suffix}',404,body)
check(patient,'GET',f'/requests/{request_id}',200)
assert check(patient,'GET',f'/requests/{request_id}/interests',200) == []
matched=check(patient,'GET',f'/requests/{request_id}/matches',200)
assert any(item['id']==donor_profile['id'] for item in matched)
assert all('email' not in item and 'user' not in item for item in matched)
seen=check(donor,'GET','/donors/me/matches',200)
assert any(item['id']==request_id for item in seen)
check(other_donor,'POST',f'/donors/me/interests/{request_id}',403)
check(donor,'POST',f'/donors/me/interests/{request_id}',200)
interests=check(patient,'GET',f'/requests/{request_id}/interests',200)
assert interests[0]['donor']['user']['email']==donor_email
check(patient,'PATCH',f'/requests/{request_id}',200,{'units':3})
assert check(patient,'GET',f'/requests/{request_id}/interests',200)==[]
check(donor,'POST',f'/donors/me/interests/{request_id}',200)
check(patient,'DELETE',f'/requests/{request_id}',200)
assert check(donor,'GET','/donors/me/matches',200)==[]
check(patient,'PATCH',f'/requests/{request_id}',409,{'units':4})
check(donor,'POST',f'/donors/me/interests/{request_id}',404)

# Changing a donor profile revokes approval and prior contact-sharing interests.
check(donor,'PUT','/donors/me',200,{**profile,'city':'Howrah'})
check(donor,'GET','/donors/me/matches',403)
exported=check(patient,'GET','/me/export',200)
assert exported['user']['email']==patient_email
assert len(exported['requests'])==1
assert 'passwordHash' not in str(exported) and 'tokenHash' not in str(exported)
assert check(other_patient,'GET','/me/export',200)['requests']==[]
check(other_patient,'DELETE','/me',403,{'password':'wrong'})
check(other_patient,'DELETE','/me',200,{'password':PASSWORD})
check(other_patient,'GET','/auth/me',401)
check(donor,'DELETE','/me/consent',200)
assert check(donor,'GET','/donors/me',200)['consentToMatch']==False
print('PASS: all Phase 2 routes reject logged-out use; role and ownership boundaries, approval, matching, consent, edit and close')
