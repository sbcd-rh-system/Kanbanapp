
async function test() {
  const baseUrl = `http://localhost:5182/api`;
  const id = '13369090';
  
  console.log('--- Searching for:', id, '---');
  try {
    const res = await fetch(`${baseUrl}/users`);
    const users = await res.json();
    const found = users.filter(u => JSON.stringify(u).includes(id));
    console.log('Results in Users:', JSON.stringify(found, null, 2));

    const res2 = await fetch(`${baseUrl}/tasks`);
    const tasks = await res2.json();
    const foundTasks = tasks.filter(t => JSON.stringify(t).includes(id));
    console.log('Results in Tasks:', JSON.stringify(foundTasks, null, 2));

    const res3 = await fetch(`${baseUrl}/projects`);
    const projects = await res3.json();
    const foundProj = projects.filter(p => JSON.stringify(p).includes(id));
    console.log('Results in Projects:', JSON.stringify(foundProj, null, 2));

  } catch (err) {
    console.error('Error:', err);
  }
}

test();
