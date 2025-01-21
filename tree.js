class BTreeNode {
  constructor(t, isLeaf) {
    this.t = t; 
    this.isLeaf = isLeaf;
    this.keys = [];
    this.children = [];
  }

  traverse() {
    let result = [];
    for (let i = 0; i < this.keys.length; i++) {
      if (!this.isLeaf) {
        result = result.concat(this.children[i].traverse());
      }
      result.push(this.keys[i]);
    }
    if (!this.isLeaf) {
      result = result.concat(this.children[this.keys.length].traverse());
    }
    return result;
  }

  search(k) {
    let i = 0;
    while (i < this.keys.length && k > this.keys[i]) {
      i++;
    }
    if (this.keys[i] === k) return this;
    if (this.isLeaf) return null;
    return this.children[i].search(k);
  }

  remove(k) {
    const idx = this.keys.findIndex((key) => key === k);

    if (idx !== -1) {
      if (this.isLeaf) {
        this.keys.splice(idx, 1);
      }
      else {
        if (this.children[idx].keys.length >= this.t) {
          const pred = this.getPredecessor(idx);
          this.keys[idx] = pred;
          this.children[idx].remove(pred);
        } else if (this.children[idx + 1].keys.length >= this.t) {
          const succ = this.getSuccessor(idx);
          this.keys[idx] = succ;
          this.children[idx + 1].remove(succ);
        } else {
          this.merge(idx);
          this.children[idx].remove(k);
        }
      }
    } else {
      if (this.isLeaf) {
        return; 
      }

      let childIdx = 0;
      while (childIdx < this.keys.length && k > this.keys[childIdx]) {
        childIdx++;
      }

      const child = this.children[childIdx];

      if (child.keys.length < this.t) {
        this.fill(childIdx);
      }

      this.children[childIdx].remove(k);
    }
  }

  getPredecessor(idx) {
    let current = this.children[idx];
    while (!current.isLeaf) {
      current = current.children[current.keys.length];
    }
    return current.keys[current.keys.length - 1];
  }

  getSuccessor(idx) {
    let current = this.children[idx + 1];
    while (!current.isLeaf) {
      current = current.children[0];
    }
    return current.keys[0];
  }

  fill(idx) {
    if (idx > 0 && this.children[idx - 1].keys.length >= this.t) {
      this.borrowFromPrev(idx);
    } else if (
      idx < this.children.length - 1 &&
      this.children[idx + 1].keys.length >= this.t
    ) {
      this.borrowFromNext(idx);
    } else {
      if (idx < this.keys.length) {
        this.merge(idx);
      } else {
        this.merge(idx - 1);
      }
    }
  }

  borrowFromPrev(idx) {
    const child = this.children[idx];
    const sibling = this.children[idx - 1];

    child.keys.unshift(this.keys[idx - 1]);
    this.keys[idx - 1] = sibling.keys.pop();

    if (!sibling.isLeaf) {
      child.children.unshift(sibling.children.pop());
    }
  }

  borrowFromNext(idx) {
    const child = this.children[idx];
    const sibling = this.children[idx + 1];

    child.keys.push(this.keys[idx]);
    this.keys[idx] = sibling.keys.shift();

    if (!sibling.isLeaf) {
      child.children.push(sibling.children.shift());
    }
  }

  merge(idx) {
    const child = this.children[idx];
    const sibling = this.children[idx + 1];

    child.keys.push(this.keys[idx]);
    child.keys = child.keys.concat(sibling.keys);

    if (!child.isLeaf) {
      child.children = child.children.concat(sibling.children);
    }

    this.keys.splice(idx, 1);
    this.children.splice(idx + 1, 1);
  }
}

class BTree {
  constructor(t) {
    this.t = t;
    this.root = new BTreeNode(t, true);
  }

  traverse() {
    return this.root ? this.root.traverse() : [];
  }

  search(k) {
    return this.root ? this.root.search(k) : null;
  }

  insert(k) {
    if (this.root.keys.length === 2 * this.t - 1) {
      const newRoot = new BTreeNode(this.t, false);
      newRoot.children.push(this.root);
      this.splitChild(newRoot, 0);
      this.root = newRoot;
    }
    this.insertNonFull(this.root, k);
  }

  insertNonFull(node, k) {
    let i = node.keys.length - 1;
    if (node.isLeaf) {
      while (i >= 0 && k < node.keys[i]) {
        i--;
      }
      node.keys.splice(i + 1, 0, k);
    } else {
      while (i >= 0 && k < node.keys[i]) {
        i--;
      }
      i++;
      if (node.children[i].keys.length === 2 * this.t - 1) {
        this.splitChild(node, i);
        if (k > node.keys[i]) i++;
      }
      this.insertNonFull(node.children[i], k);
    }
  }

  splitChild(parent, i) {
    const t = this.t;
    const fullChild = parent.children[i];
    const newChild = new BTreeNode(t, fullChild.isLeaf);

    newChild.keys = fullChild.keys.splice(t);
    if (!fullChild.isLeaf) {
      newChild.children = fullChild.children.splice(t);
    }

    parent.keys.splice(i, 0, fullChild.keys.pop());
    parent.children.splice(i + 1, 0, newChild);
  }

  remove(k) {
    if (!this.root) return;

    this.root.remove(k);

    if (this.root.keys.length === 0) {
      if (this.root.isLeaf) {
        this.root = null;
      } else {
        this.root = this.root.children[0];
      }
    }
  }
}

let btree = new BTree(2);

function insertValue() {
  const value = parseInt(document.getElementById("inputValue").value);
  if (!isNaN(value)) {
    btree.insert(value);
    renderTree();
  }
}

function searchValue() {
  const value = parseInt(document.getElementById("inputValue").value);
  const result = btree.search(value);
  alert(result ? "Valor encontrado!" : "Valor não encontrado!");
}

function deleteValue() {
  const value = parseInt(document.getElementById("inputValue").value);
  if (!isNaN(value)) {
    btree.remove(value);
    renderTree();
  }
}

function renderTree() {
  const container = document.getElementById("tree-container");
  container.innerHTML = ""; 
  renderNode(btree.root, container, 0);
}

function renderNode(node, container, level) {
  if (!node) return;

  const nodeContainer = document.createElement("div");
  nodeContainer.className = "node-container";
  nodeContainer.style.textAlign = "center";
  nodeContainer.style.marginTop = "20px";

  const nodeDiv = document.createElement("div");
  nodeDiv.className = "node";
  nodeDiv.textContent = `[ ${node.keys.join(" | ")} ]`;

  nodeContainer.appendChild(nodeDiv);
  container.appendChild(nodeContainer);

  if (!node.isLeaf) {
    const branchDiv = document.createElement("div");
    branchDiv.className = "branch";
    branchDiv.style.display = "flex";
    branchDiv.style.justifyContent = "center";
    branchDiv.style.marginTop = "10px";

    node.children.forEach((child) => {
      const childContainer = document.createElement("div");
      childContainer.style.margin = "0 10px";
      renderNode(child, childContainer, level + 1);
      branchDiv.appendChild(childContainer);
    });

    container.appendChild(branchDiv);
  }
}
