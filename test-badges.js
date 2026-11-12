const tests = [
  { name: 'Trophy', url: 'http://localhost:3000/api/badges?username=ErBharatMalhotra&type=trophy' },
  { name: 'Heatmap', url: 'http://localhost:3000/api/badges?username=ErBharatMalhotra&type=heatmap' },
  { name: 'Snake', url: 'http://localhost:3000/api/badges?username=ErBharatMalhotra&type=snake' },
  { name: 'Activity', url: 'http://localhost:3000/api/badges?username=ErBharatMalhotra&type=activity' },
  { name: 'Visitor', url: 'http://localhost:3000/api/badges?username=ErBharatMalhotra&type=visitor' },
  { name: 'Typing', url: 'http://localhost:3000/api/badges?username=ErBharatMalhotra&type=typing' },
  { name: 'Star History', url: 'http://localhost:3000/api/badges?username=ErBharatMalhotra&type=star-history' },
  { name: 'Language Donut', url: 'http://localhost:3000/api/badges?username=ErBharatMalhotra&type=language-donut' },
  { name: 'Skill Bubbles', url: 'http://localhost:3000/api/badges?username=ErBharatMalhotra&type=skill-bubbles' },
  { name: 'ASCII', url: 'http://localhost:3000/api/badges?username=ErBharatMalhotra&type=ascii' },
  { name: 'Streak Calendar', url: 'http://localhost:3000/api/badges?username=ErBharatMalhotra&type=streak-calendar' },
];

async function runTests() {
  for (const test of tests) {
    try {
      const r = await fetch(test.url);
      console.log(test.name + ': ' + r.status + ' ' + r.headers.get('content-type'));
    } catch (e) {
      console.log(test.name + ': ERROR - ' + e.message);
    }
  }
}
runTests();