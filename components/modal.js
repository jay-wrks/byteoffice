window.ByteOfficeComponents = window.ByteOfficeComponents || {};
window.ByteOfficeComponents.modal = String.raw`
<div aria-modal="true" class="modal hidden" id="modal" role="dialog">
<div class="modal-card">
<button aria-label="Close" class="modal-close" id="modalClose">×</button>
<div id="modalContent"></div>
</div>
</div>
`;
