import { h } from '../packages/signals/jsx.js';
import { createSignal } from '../packages/signals/reactive.js';
import { For } from '../packages/signals/for.js';

function ListExample() {
  const [items, setItems] = createSignal([
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
  ]);

  const addItem = () => {
    const newItem = { id: Date.now(), name: `Item ${Date.now()}` };
    setItems([...items(), newItem]);
  };

  return (
    <div>
      <button onClick={addItem}>Add Item</button>
      <For each={items}>
        {(item) => (
          <div key={item.id}>
            <span>{item.name}</span>
          </div>
        )}
      </For>
    </div>
  );
}

export default ListExample;
