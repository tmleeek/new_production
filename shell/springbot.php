<?php
/**
 * There are a few similarities to this and Mage_Shell_Abstract. Springbot still
 * officially supports Magento 1.3.*, therefore, we needed to roll our own.
 */
class Springbot_Shell
{
	protected $_action;

	protected $_type;

	protected $_appCode     = 'admin';

	protected $_appType     = 'store';

	protected $_magentoRootDir;

	protected $_args;

	protected $_registry = array(
		'harvest'                => array(
			'attributeSets'         => 'Springbot_Services_Harvest_AttributeSets',
			'carts'                 => 'Springbot_Services_Harvest_Carts',
			'categories'            => 'Springbot_Services_Harvest_Categories',
			'customerAttributeSets' => 'Springbot_Services_Harvest_CustomerAttributeSets',
			'customers'             => 'Springbot_Services_Harvest_Customers',
			'guests'                => 'Springbot_Services_Harvest_Guests',
			'products'              => 'Springbot_Services_Harvest_Products',
			'purchases'             => 'Springbot_Services_Harvest_Purchases',
			'subscribers'           => 'Springbot_Services_Harvest_Subscribers',
		),
		'post'          => array(
			'attribute'    => 'Springbot_Services_Post_Attribute',
			'attributeSet' => 'Springbot_Services_Post_AttributeSet',
			'cart'         => 'Springbot_Services_Post_Cart',
			'category'     => 'Springbot_Services_Post_Category',
			'customer'     => 'Springbot_Services_Post_Customer',
			'json'         => 'Springbot_Services_Post_Json',
			'product'      => 'Springbot_Services_Post_Product',
			'purchase'     => 'Springbot_Services_Post_Purchase',
			'subscriber'   => 'Springbot_Services_Post_Subscriber',
			'jsonstring'   => 'Springbot_Services_Post_Jsonstring'
		),
		'cmd'          => array(
			'halt'        => 'Springbot_Services_Cmd_Halt',
			'harvest'     => 'Springbot_Services_Cmd_Harvest',
			'healthcheck' => 'Springbot_Services_Cmd_Healthcheck',
			'parse'       => 'Springbot_Services_Cmd_Parse',
			'update'      => 'Springbot_Services_Cmd_Update',
			'forecast'    => 'Springbot_Services_Cmd_Forecast',
		),
		'store'     => array(
			'register' => 'Springbot_Services_Store_Register',
			'finalize' => 'Springbot_Services_Store_Finalize'
		),
		'log' => array(
			'purchase'  => 'Springbot_Services_Log_Purchase',
			'installer' => 'Springbot_Services_Log_Installer',
		),
		'work'     => array(
			'cleanup' => 'Springbot_Services_Work_Cleanup',
			'runner'  => 'Springbot_Services_Work_Runner',
			'manager' => 'Springbot_Services_Work_Manager',
			'restart' => 'Springbot_Services_Work_Restart',
			'stop'    => 'Springbot_Services_Work_Stop',
			'report'  => 'Springbot_Services_Work_Report'
		),
	);

	public function __construct()
	{
		$this->_validate();

		require_once $this->getApplicationPath() . $this->getMagePath();
		Mage::app($this->_appCode, $this->_appType);

		$this->_parseArgs();
	}

	public function run()
	{
		try{
			Springbot_Log::debug("Running {$this->_action}:{$this->_type}");
			$className = $this->_registry[$this->_action][$this->_type];
			$class = new $className();
			$ret = $class->setData($this->_args)->run();
			echo $ret;
		} catch (Exception $e) {
			Springbot_Log::error($e);
			echo $e->getMessage() . PHP_EOL;
			exit(1);
		}
	}

	public function getMagePath()
	{
		return 'app' . DIRECTORY_SEPARATOR . 'Mage.php';
	}

	public function getApplicationPath()
	{
		if(!isset($this->_magentoRootDir)) {
			if(file_exists($this->getMagePath())) {
				$this->_magentoRootDir = getcwd() . DIRECTORY_SEPARATOR;
			} else {
				for ($i = 0, $d = ''; !file_exists($d.$this->getMagePath()) && $i++ < 10; $d .= '../');
				$this->_magentoRootDir = getcwd() . DIRECTORY_SEPARATOR . $d;
			}

			if(!file_exists($this->_magentoRootDir . $this->getMagePath())) {
				throw new Exception("Cannot find Mage root path!");
			}
		}
		return $this->_magentoRootDir;
	}

	protected function _parseArgs()
	{
		try {
			$argv = $_SERVER['argv'];

			$opts = getopt('s:i:h:c:o:dfrv:m:j:n:p:');

			list($this->_action, $this->_type) = explode(':', end($argv));

			$this->_args = Springbot_Services_Registry::parseOpts($opts);

			if(!isset($this->_action) || !isset($this->_type)) {
				throw new Exception;
			}

			if(!isset($this->_registry[$this->_action][$this->_type])) {
				$msg = 'Provided action not registered!';
				print $msg . PHP_EOL;
				Springbot_Log::debug($msg);
				exit(1);
			}
		} catch (Exception $e) {
			Springbot_Log::error($e);
			$this->_usage();
			exit;
		}
	}

	protected function _validate()
	{
	}

	protected function _usage()
	{
		print <<<USAGE
Usage:  \033[1mphp shell/springbot.php -s\033[0m \033[4mstore_id\033[0m \033[1m-i\033[0m \033[4mstart_id\033[0m:\033[4mend_id\033[0m \033[1maction:type\033[0m

USAGE;
	}
}

$shell = new Springbot_Shell;

$shell->run();
