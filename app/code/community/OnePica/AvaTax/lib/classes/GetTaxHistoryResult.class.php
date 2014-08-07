<?php
/**
 * GetTaxHistoryResult.class.php
 * @package Tax
 */

/**
 * Result data returned from {@link TaxServiceSoap#getTaxHistory} for a previously calculated tax document.
 *
 * @package Tax
 * @see GetTaxHistoryRequest
 * @author tblanchard
 * Copyright (c) 2007, Avalara.  All rights reserved.
 */

class GetTaxHistoryResult //extends BaseResult
{
    private $GetTaxRequest;
    private $GetTaxResult;
    	
   /**
     * Gets the original {@link GetTaxRequest} for the document.
     * 
     * @return GetTaxRequest
     */

	public function getGetTaxRequest() { return $this->GetTaxRequest; }

   /**
     * Gets the original {@link GetTaxResult} for the document.
     * 
     * @return GetTaxResult
     */

    public function getGetTaxResult() { return $this->GetTaxResult; }
        	
			
// BaseResult innards - work around a bug in SoapClient

/**
 * @var string
 */
    private $TransactionId;
/**
 * @var string must be one of the values defined in {@link SeverityLevel}.
 */
    private $ResultCode = 'Success';
/**
 * @var array of Message.
 */
    private $Messages = array();

/**
 * Accessor
 * @return string
 */
    public function getTransactionId() { return $this->TransactionId; }
/**
 * Accessor
 * @return string
 */
    public function getResultCode() { return $this->ResultCode; }
/**
 * Accessor
 * @return array
 */
    public function getMessages() { return EnsureIsArray($this->Messages->Message); }


}

?>