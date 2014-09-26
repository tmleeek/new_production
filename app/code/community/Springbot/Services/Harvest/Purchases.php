<?php

class Springbot_Services_Harvest_Purchases extends Springbot_Services_Harvest
{
	protected $_type = 'purchases';

	public function run()
	{
		$collection = self::getCollection($this->getStoreId())
			->addFieldToFilter('entity_id', array('gt' => $this->getStartId()));
		$stopId = $this->getStopId();
		if ($stopId !== null) {
			$collection->addFieldToFilter('entity_id', array('lteq' => $this->getStopId()));
		}

		$this->_harvester = Mage::getModel('combine/harvest_purchases')
			->setCollection($collection)
			->setDataSource($this->getDataSource())
			->harvest();

		return parent::run();
	}

	public static function getCollection($storeId, $partition = null)
	{
		$collection = Mage::getModel('sales/order')
			->getCollection()
			->addFieldToFilter('store_id', $storeId);

		if($partition) {
			$collection = parent::limitCollection($collection, $partition);
		}
		return $collection;
	}
}