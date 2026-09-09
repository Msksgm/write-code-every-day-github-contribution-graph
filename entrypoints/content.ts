export default defineContentScript({
  matches: ['https://github.com/Msksgm'],
  main() {
    const id = document.getElementById('write-code-every-day-root')
    if (id !== null) {
      return
    }
    const element = document.createElement('div');
    element.id = 'write-code-every-day-root';
    element.textContent = 'Write Code Every Day';
    document.body.prepend(element);
  },
});
