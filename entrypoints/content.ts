export default defineContentScript({
  matches: ['https://github.com/Msksgm'],
  main() {
    const element = document.createElement('div');
    element.textContent = 'Write Code Every Day';
    document.body.prepend(element);
  },
});
