// Shopping List Manager - Save, view, and manage shopping lists
class ShoppingListManager {
    constructor() {
        this.lists = this.loadShoppingLists();
    }
    
    loadShoppingLists() {
        const saved = localStorage.getItem('savedShoppingLists');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveShoppingList(name, items, totalCost, source, zipcode) {
        const list = {
            id: Date.now(),
            name: name || `Shopping List ${new Date().toLocaleDateString()}`,
            items: items.map(item => ({
                ...item,
                checked: false
            })),
            totalCost,
            source,
            zipcode,
            savedAt: new Date().toISOString(),
            completed: false
        };
        
        this.lists.unshift(list);
        localStorage.setItem('savedShoppingLists', JSON.stringify(this.lists));
        
        this.showMessage('Shopping list saved successfully!', 'success');
        return list;
    }
    
    showSavedLists() {
        const modalHTML = `
            <div class="modal-overlay" id="shopping-lists-modal">
                <div class="modal-content large">
                    <div class="modal-header">
                        <h2><i class="fas fa-shopping-cart"></i> Saved Shopping Lists</h2>
                        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        ${this.lists.length === 0 ? 
                            '<div class="no-lists"><p>No saved shopping lists yet.</p><p>Generate a meal plan to create your first list!</p></div>' :
                            `<div class="lists-container">${this.lists.map(list => this.createListCard(list)).join('')}</div>`
                        }
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    createListCard(list) {
        const completedItems = list.items.filter(item => item.checked).length;
        const progress = (completedItems / list.items.length * 100).toFixed(0);
        
        return `
            <div class="list-card" data-list-id="${list.id}">
                <div class="list-header">
                    <h3>${list.name}</h3>
                    <div class="list-meta">
                        <span class="list-cost">$${list.totalCost.toFixed(2)}</span>
                        <span class="list-date">${new Date(list.savedAt).toLocaleDateString()}</span>
                        <span class="list-items">${list.items.length} items</span>
                    </div>
                </div>
                
                <div class="list-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <span class="progress-text">${completedItems}/${list.items.length} completed (${progress}%)</span>
                </div>
                
                <div class="list-actions">
                    <button class="btn btn-small" onclick="shoppingListManager.viewList(${list.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-small" onclick="shoppingListManager.downloadList(${list.id})">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="btn btn-small btn-danger" onclick="shoppingListManager.deleteList(${list.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
                
                <div class="list-preview">
                    ${list.items.slice(0, 3).map(item => `
                        <div class="preview-item ${item.checked ? 'checked' : ''}">${item.name} - $${item.price.toFixed(2)}</div>
                    `).join('')}
                    ${list.items.length > 3 ? `<div class="preview-more">...and ${list.items.length - 3} more items</div>` : ''}
                </div>
            </div>
        `;
    }
    
    viewList(listId) {
        const list = this.lists.find(l => l.id === listId);
        if (!list) return;
        
        const viewHTML = `
            <div class="modal-overlay" id="view-list-modal">
                <div class="modal-content large">
                    <div class="modal-header">
                        <h2>${list.name}</h2>
                        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="list-meta-full">
                            <div class="meta-row">
                                <div class="meta-item">
                                    <strong>Total Cost:</strong> $${list.totalCost.toFixed(2)}
                                </div>
                                <div class="meta-item">
                                    <strong>Items:</strong> ${list.items.length}
                                </div>
                            </div>
                            <div class="meta-row">
                                <div class="meta-item">
                                    <strong>Created:</strong> ${new Date(list.savedAt).toLocaleString()}
                                </div>
                                <div class="meta-item">
                                    <strong>ZIP Code:</strong> ${list.zipcode || 'N/A'}
                                </div>
                            </div>
                        </div>
                        
                        <div class="shopping-list-view">
                            ${list.items.map((item, index) => `
                                <div class="shopping-item ${item.checked ? 'checked' : ''}">
                                    <input type="checkbox" id="item-${listId}-${index}" 
                                           ${item.checked ? 'checked' : ''} 
                                           onchange="shoppingListManager.toggleItem(${listId}, ${index})">
                                    <label for="item-${listId}-${index}">
                                        ${item.name}
                                    </label>
                                    <span class="item-price">$${item.price.toFixed(2)}</span>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="list-actions-full">
                            <button class="btn btn-primary" onclick="shoppingListManager.downloadList(${listId})">
                                <i class="fas fa-download"></i> Download as Text
                            </button>
                            <button class="btn btn-secondary" onclick="shoppingListManager.printList(${listId})">
                                <i class="fas fa-print"></i> Print List
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', viewHTML);
    }
    
    toggleItem(listId, itemIndex) {
        const list = this.lists.find(l => l.id === listId);
        if (list && list.items[itemIndex]) {
            list.items[itemIndex].checked = !list.items[itemIndex].checked;
            localStorage.setItem('savedShoppingLists', JSON.stringify(this.lists));
            
            // Update the visual state
            const checkbox = document.getElementById(`item-${listId}-${itemIndex}`);
            const container = checkbox.closest('.shopping-item');
            if (checkbox.checked) {
                container.classList.add('checked');
            } else {
                container.classList.remove('checked');
            }
        }
    }
    
    deleteList(listId) {
        if (confirm('Are you sure you want to delete this shopping list?')) {
            this.lists = this.lists.filter(l => l.id !== listId);
            localStorage.setItem('savedShoppingLists', JSON.stringify(this.lists));
            
            // Remove the card from view
            const card = document.querySelector(`[data-list-id="${listId}"]`);
            if (card) {
                card.remove();
            }
            
            this.showMessage('Shopping list deleted', 'success');
            
            // Show message if no lists left
            if (this.lists.length === 0) {
                const container = document.querySelector('.lists-container');
                if (container) {
                    container.innerHTML = '<div class="no-lists"><p>No saved shopping lists yet.</p><p>Generate a meal plan to create your first list!</p></div>';
                }
            }
        }
    }
    
    downloadList(listId) {
        const list = this.lists.find(l => l.id === listId);
        if (!list) return;
        
        let content = `${list.name}\n`;
        content += `Created: ${new Date(list.savedAt).toLocaleString()}\n`;
        content += `Total Cost: $${list.totalCost.toFixed(2)}\n`;
        content += `Items: ${list.items.length}\n`;
        if (list.zipcode) content += `ZIP Code: ${list.zipcode}\n`;
        content += `\nShopping List:\n`;
        content += `${'='.repeat(50)}\n\n`;
        
        list.items.forEach((item, index) => {
            const status = item.checked ? '✓' : '☐';
            content += `${status} ${item.name} - $${item.price.toFixed(2)}\n`;
        });
        
        content += `\n${'='.repeat(50)}\n`;
        content += `Total: $${list.totalCost.toFixed(2)}\n`;
        content += `\nGenerated by Family Budget Meals App`;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${list.name.replace(/[^a-z0-9]/gi, '_')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    printList(listId) {
        const list = this.lists.find(l => l.id === listId);
        if (!list) return;
        
        const printWindow = window.open('', '_blank');
        const printHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${list.name} - Shopping List</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                    .meta { margin-bottom: 20px; }
                    .item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                    .total { font-weight: bold; margin-top: 10px; padding-top: 10px; border-top: 2px solid #333; }
                    .checkbox { width: 20px; height: 20px; border: 2px solid #333; margin-right: 10px; display: inline-block; vertical-align: middle; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${list.name}</h1>
                </div>
                <div class="meta">
                    <p><strong>Created:</strong> ${new Date(list.savedAt).toLocaleString()}</p>
                    <p><strong>Total Items:</strong> ${list.items.length}</p>
                    <p><strong>Estimated Total:</strong> $${list.totalCost.toFixed(2)}</p>
                    ${list.zipcode ? `<p><strong>ZIP Code:</strong> ${list.zipcode}</p>` : ''}
                </div>
                <div class="items">
                    ${list.items.map(item => `
                        <div class="item">
                            <span><span class="checkbox"></span> ${item.name}</span>
                            <span>$${item.price.toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="total">
                    Total: $${list.totalCost.toFixed(2)}
                </div>
                <script>window.print();</script>
            </body>
            </html>
        `;
        
        printWindow.document.write(printHTML);
        printWindow.document.close();
    }
    
    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `toast-message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white;
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(messageDiv);
        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }
}

// Initialize global shopping list manager
const shoppingListManager = new ShoppingListManager();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.ShoppingListManager = ShoppingListManager;
    window.shoppingListManager = shoppingListManager;
}
