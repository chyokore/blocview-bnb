# BLOCview judge demo

This path takes about 90–120 seconds.

1. Open the [homepage](https://blocview-agents.chinyereokore.chatgpt.site/). Notice the evidence-before-activation boundary.
2. Select **Explore 4 live BSC agents**. Notice one identity in each supported category.
3. Select all four and compare them. Notice equal profile depth, explicit unknowns, and Coverage of **5/8, 8/8, 5/8, 5/8**.
4. Open **GridBand Observer**, token ID `321995`. Inspect its ERC-8004 identity, registration metadata, and 8004scan fields. Zero reputation remains zero.
5. Inspect PancakeSwap V3 evidence. Notice the fixed WBNB/USDT 0.05% pool and separation of BLOCview's read from RangePilotWatch.
6. Confirm pool `WBNB-USDT-500` and enter boundaries:

   ```text
   -100000,0,100000
   ```

7. Run the read-only assessment. No wallet, signature, approval, payment, or transaction is requested.
8. Review the receipt and confirm: **“Assessment complete. No execution occurred.”** Inspect pinned-block provenance and the separately labelled cross-check.

If evidence is unavailable, the correct result is a visible unavailable state. BLOCview does not fabricate or silently substitute demo evidence.
